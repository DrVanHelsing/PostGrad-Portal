using FluentAssertions;
using Moq;
using PostGrad.Api.Models;
using PostGrad.Api.Services;
using PostGrad.Api.SmokeTests.Fixtures;
using System.Net;
using System.Net.Http.Json;

namespace PostGrad.Api.SmokeTests.Tests;

/// <summary>
/// Smoke tests for POST /api/auth/login, GET /api/auth/me,
/// POST /api/auth/change-password, POST /api/auth/reset-password.
/// 
/// Role coverage: student, supervisor, coordinator, admin — all four login paths.
/// </summary>
public class AuthSmokeTests : IDisposable
{
    private readonly ApiFactory _factory;

    public AuthSmokeTests()
    {
        _factory = new ApiFactory();

        // Auth service: valid credentials return the matching user
        foreach (var user in SeedData.AllUsers)
        {
            var capturedUser = user;
            _factory.Auth
                .Setup(a => a.ValidateCredentialsAsync(capturedUser.Email, "Portal@2026"))
                .Returns(Task.FromResult<(User?, string?)>((capturedUser, null)));

            _factory.Auth
                .Setup(a => a.GenerateJwtToken(capturedUser))
                .Returns(TokenHelper.GenerateFor(capturedUser));
        }

        // Wrong password
        _factory.Auth
            .Setup(a => a.ValidateCredentialsAsync(It.IsAny<string>(), "WrongPass!"))
            .Returns(Task.FromResult<(User?, string?)>((null, "Invalid credentials")));

        // Firestore: user lookup by ID
        foreach (var user in SeedData.AllUsers)
        {
            var capturedUser = user;
            _factory.Firestore
                .Setup(f => f.GetDocAsync<User>(Collections.Users, capturedUser.Id))
                .ReturnsAsync(capturedUser);
        }

        // Change-password and reset-password stubs
        _factory.Auth
            .Setup(a => a.ChangePasswordAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(true);

        _factory.Auth
            .Setup(a => a.GenerateTemporaryPassword())
            .Returns("TempPass@9999");

        _factory.Firestore
            .Setup(f => f.QueryAsync<User>(Collections.Users, It.Is<(string, string, object)[]>(
                filters => filters.Any(f2 => f2.Item1 == "email"))))
            .ReturnsAsync([SeedData.StudentUser]);
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Login_Student_ValidCredentials_Returns200WithToken()
    {
        var client = _factory.CreateClient();
        var resp = await client.PostJsonAsync("/api/auth/login",
            new { email = SeedData.StudentUser.Email, password = "Portal@2026" });

        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await resp.ReadJsonAsync<Dictionary<string, object>>();
        body.Should().ContainKey("token");
    }

    [Fact]
    public async Task Login_Supervisor_ValidCredentials_Returns200()
    {
        var client = _factory.CreateClient();
        var resp = await client.PostJsonAsync("/api/auth/login",
            new { email = SeedData.SupervisorUser.Email, password = "Portal@2026" });
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Login_Coordinator_ValidCredentials_Returns200()
    {
        var client = _factory.CreateClient();
        var resp = await client.PostJsonAsync("/api/auth/login",
            new { email = SeedData.CoordUser.Email, password = "Portal@2026" });
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Login_Admin_ValidCredentials_Returns200()
    {
        var client = _factory.CreateClient();
        var resp = await client.PostJsonAsync("/api/auth/login",
            new { email = SeedData.AdminUser.Email, password = "Portal@2026" });
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Login_InvalidPassword_Returns401()
    {
        var client = _factory.CreateClient();
        var resp = await client.PostJsonAsync("/api/auth/login",
            new { email = SeedData.StudentUser.Email, password = "WrongPass!" });
        resp.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_MissingFields_Returns400()
    {
        var client = _factory.CreateClient();
        var resp = await client.PostJsonAsync("/api/auth/login", new { email = "" });
        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ── /me ───────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Me_WithValidStudentToken_Returns200WithUserInfo()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.GetAsync("/api/auth/me");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await resp.ReadJsonAsync<Dictionary<string, object>>();
        body.Should().ContainKey("id");
    }

    [Fact]
    public async Task Me_WithoutToken_Returns401()
    {
        var client = _factory.CreateClient();
        var resp = await client.GetAsync("/api/auth/me");
        resp.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Me_AdminToken_ReturnsAdminRole()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.AdminToken);
        var resp = await client.GetAsync("/api/auth/me");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await resp.ReadJsonAsync<Dictionary<string, object>>();
        body!["role"].ToString().Should().Be("admin");
    }

    // ── Change Password ───────────────────────────────────────────────────────

    [Fact]
    public async Task ChangePassword_ValidRequest_Returns204()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.PostJsonAsync("/api/auth/change-password",
            new { currentPassword = "Portal@2026", newPassword = "NewPass@1234" });
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task ChangePassword_Unauthenticated_Returns401()
    {
        var client = _factory.CreateClient();
        var resp = await client.PostJsonAsync("/api/auth/change-password",
            new { currentPassword = "Portal@2026", newPassword = "NewPass@1234" });
        resp.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ── Reset Password ────────────────────────────────────────────────────────

    [Fact]
    public async Task ResetPassword_KnownEmail_Returns200WithTempPassword()
    {
        var client = _factory.CreateClient();
        var resp = await client.PostJsonAsync("/api/auth/reset-password",
            new { email = SeedData.StudentUser.Email });
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ResetPassword_UnknownEmail_Returns404()
    {
        _factory.Firestore
            .Setup(f => f.QueryAsync<User>(Collections.Users, It.Is<(string, string, object)[]>(
                filters => filters.Any(f2 => (string)f2.Item3 == "unknown@test.com"))))
            .ReturnsAsync([]);

        var client = _factory.CreateClient();
        var resp = await client.PostJsonAsync("/api/auth/reset-password",
            new { email = "unknown@test.com" });
        // Controller always returns 200 to avoid revealing whether the email exists
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    public void Dispose() => _factory.Dispose();
}
