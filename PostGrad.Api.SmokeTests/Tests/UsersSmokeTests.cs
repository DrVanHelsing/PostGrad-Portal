using FluentAssertions;
using Moq;
using PostGrad.Api.Models;
using PostGrad.Api.Services;
using PostGrad.Api.SmokeTests.Fixtures;
using System.Net;

namespace PostGrad.Api.SmokeTests.Tests;

/// <summary>
/// Smoke tests for the /api/users endpoints.
/// Verifies CRUD operations and role-based access control:
///   - Admin: full access
///   - Coordinator: read + nudge
///   - Supervisor: read only
///   - Student: own profile update only
/// </summary>
public class UsersSmokeTests : IDisposable
{
    private readonly ApiFactory _factory;

    public UsersSmokeTests()
    {
        _factory = new ApiFactory();

        _factory.Firestore
            .Setup(f => f.GetCollectionAsync<User>(Collections.Users))
            .ReturnsAsync([.. SeedData.AllUsers]);

        foreach (var user in SeedData.AllUsers)
        {
            var u = user;
            _factory.Firestore
                .Setup(f => f.GetDocAsync<User>(Collections.Users, u.Id))
                .ReturnsAsync(u);

            _factory.Firestore
                .Setup(f => f.QueryAsync<User>(Collections.Users,
                    It.IsAny<(string, string, object)[]>()))
                .ReturnsAsync([u]);
        }

        _factory.Firestore
            .Setup(f => f.AddDocAsync(Collections.Users, It.IsAny<Dictionary<string, object>>()))
            .ReturnsAsync("new-user-001");

        _factory.Firestore
            .Setup(f => f.GetDocAsync<User>(Collections.Users, "new-user-001"))
            .ReturnsAsync(new User
            {
                Id = "new-user-001", Email = "new@test.com", Name = "New User", Role = "student"
            });

        _factory.Firestore
            .Setup(f => f.UpdateDocAsync(Collections.Users, It.IsAny<string>(), It.IsAny<Dictionary<string, object>>()))
            .Returns(Task.CompletedTask);

        _factory.Firestore
            .Setup(f => f.DeleteDocAsync(Collections.Users, It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        _factory.Firestore
            .Setup(f => f.AddAuditLogAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>()))
            .Returns(Task.CompletedTask);

        _factory.Firestore
            .Setup(f => f.AddNotificationAsync(It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>()))
            .Returns(Task.CompletedTask);
    }

    // ── GET /api/users ────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAll_Admin_Returns200WithAllUsers()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.AdminToken);
        var resp = await client.GetAsync("/api/users");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        var users = await resp.ReadJsonAsync<List<Dictionary<string, object>>>();
        users.Should().HaveCountGreaterThanOrEqualTo(4);
    }

    [Fact]
    public async Task GetAll_Coordinator_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.CoordinatorToken);
        var resp = await client.GetAsync("/api/users");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAll_Student_Returns403()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.GetAsync("/api/users");
        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetAll_Supervisor_Returns403()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.SupervisorToken);
        var resp = await client.GetAsync("/api/users");
        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // ── GET /api/users/{id} ───────────────────────────────────────────────────

    [Fact]
    public async Task GetById_Admin_KnownId_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.AdminToken);
        var resp = await client.GetAsync($"/api/users/{SeedData.StudentUser.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetById_Admin_UnknownId_Returns404()
    {
        _factory.Firestore
            .Setup(f => f.GetDocAsync<User>(Collections.Users, "no-such-id"))
            .ReturnsAsync((User?)null);

        var client = _factory.CreateClientWithToken(TokenHelper.AdminToken);
        var resp = await client.GetAsync("/api/users/no-such-id");
        resp.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── GET /api/users/by-role/{role} ─────────────────────────────────────────

    [Fact]
    public async Task GetByRole_Admin_Student_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.AdminToken);
        var resp = await client.GetAsync("/api/users/by-role/student");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ── POST /api/users ───────────────────────────────────────────────────────

    [Fact]
    public async Task CreateUser_Admin_ValidPayload_Returns201()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.AdminToken);
        var resp = await client.PostJsonAsync("/api/users", new
        {
            email = "new@test.com",
            name = "New User",
            role = "student",
        });
        resp.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task CreateUser_Coordinator_Returns403()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.CoordinatorToken);
        var resp = await client.PostJsonAsync("/api/users", new
        {
            email = "new2@test.com", name = "Another", role = "student"
        });
        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task CreateUser_MissingEmail_Returns400()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.AdminToken);
        var resp = await client.PostJsonAsync("/api/users", new { name = "Bad User", role = "student" });
        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ── PATCH /api/users/{id} (role update) ───────────────────────────────────

    [Fact]
    public async Task UpdateRole_Admin_Returns204()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.AdminToken);
        var resp = await client.PatchJsonAsync(
            $"/api/users/{SeedData.StudentUser.Id}/role",
            new { role = "coordinator" });
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task UpdateRole_Supervisor_Returns403()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.SupervisorToken);
        var resp = await client.PatchJsonAsync(
            $"/api/users/{SeedData.StudentUser.Id}/role",
            new { role = "coordinator" });
        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // ── DELETE /api/users/{id} ────────────────────────────────────────────────

    [Fact]
    public async Task DeleteUser_Admin_Returns204()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.AdminToken);
        var resp = await client.DeleteAsync($"/api/users/{SeedData.StudentUser.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task DeleteUser_Coordinator_Returns403()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.CoordinatorToken);
        var resp = await client.DeleteAsync($"/api/users/{SeedData.StudentUser.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // ── PATCH /api/users/me/profile ───────────────────────────────────────────

    [Fact]
    public async Task UpdateProfile_Student_Returns204()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.PatchJsonAsync("/api/users/me/profile",
            new { name = "Updated Name" });
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task UpdateProfile_Unauthenticated_Returns401()
    {
        var client = _factory.CreateClient();
        var resp = await client.PatchJsonAsync("/api/users/me/profile",
            new { name = "Updated Name" });
        resp.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ── POST /api/users/{studentId}/nudge ─────────────────────────────────────

    [Fact]
    public async Task NudgeStudent_Supervisor_Returns204()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.SupervisorToken);
        var resp = await client.PostJsonAsync($"/api/users/{SeedData.StudentUser.Id}/nudge",
            new
            {
                studentId = SeedData.StudentUser.Id,
                supervisorId = SeedData.SupervisorUser.Id,
                message = "Please submit chapter 2."
            });
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task NudgeStudent_Student_Returns403()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.PostJsonAsync($"/api/users/{SeedData.StudentUser.Id}/nudge",
            new
            {
                studentId = SeedData.StudentUser.Id,
                supervisorId = SeedData.SupervisorUser.Id,
            });
        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    public void Dispose() => _factory.Dispose();
}
