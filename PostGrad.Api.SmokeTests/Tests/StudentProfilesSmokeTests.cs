using FluentAssertions;
using Moq;
using PostGrad.Api.Models;
using PostGrad.Api.Services;
using PostGrad.Api.SmokeTests.Fixtures;
using System.Net;

namespace PostGrad.Api.SmokeTests.Tests;

/// <summary>Smoke tests for /api/student-profiles.</summary>
public class StudentProfilesSmokeTests : IDisposable
{
    private readonly ApiFactory _factory;

    public StudentProfilesSmokeTests()
    {
        _factory = new ApiFactory();

        _factory.Firestore
            .Setup(f => f.GetCollectionAsync<StudentProfile>(Collections.StudentProfiles))
            .ReturnsAsync([SeedData.Profile]);

        _factory.Firestore
            .Setup(f => f.GetDocAsync<StudentProfile>(Collections.StudentProfiles, SeedData.Profile.Id))
            .ReturnsAsync(SeedData.Profile);

        _factory.Firestore
            .Setup(f => f.QueryAsync<StudentProfile>(Collections.StudentProfiles,
                It.IsAny<(string, string, object)[]>()))
            .ReturnsAsync([SeedData.Profile]);

        _factory.Firestore
            .Setup(f => f.AddDocAsync(Collections.StudentProfiles, It.IsAny<Dictionary<string, object>>()))
            .ReturnsAsync("prof-new");

        _factory.Firestore
            .Setup(f => f.GetDocAsync<StudentProfile>(Collections.StudentProfiles, "prof-new"))
            .ReturnsAsync(SeedData.Profile);

        _factory.Firestore
            .Setup(f => f.UpdateDocAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Dictionary<string, object>>()))
            .Returns(Task.CompletedTask);

        _factory.Firestore
            .Setup(f => f.DeleteDocAsync(It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);
    }

    // ── GET /api/student-profiles ─────────────────────────────────────────

    [Fact]
    public async Task GetAll_Supervisor_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.SupervisorToken);
        var resp = await client.GetAsync("/api/student-profiles");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAll_Coordinator_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.CoordinatorToken);
        var resp = await client.GetAsync("/api/student-profiles");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAll_Student_Returns403()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.GetAsync("/api/student-profiles");
        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetAll_Unauthenticated_Returns401()
    {
        var client = _factory.CreateClient();
        var resp = await client.GetAsync("/api/student-profiles");
        resp.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ── GET /api/student-profiles/{id} ────────────────────────────────────

    [Fact]
    public async Task GetById_KnownId_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.SupervisorToken);
        var resp = await client.GetAsync($"/api/student-profiles/{SeedData.Profile.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetById_UnknownId_Returns404()
    {
        _factory.Firestore
            .Setup(f => f.GetDocAsync<StudentProfile>(Collections.StudentProfiles, "unknown-id"))
            .ReturnsAsync((StudentProfile?)null);

        var client = _factory.CreateClientWithToken(TokenHelper.SupervisorToken);
        var resp = await client.GetAsync("/api/student-profiles/unknown-id");
        resp.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── GET /api/student-profiles/by-user/{userId} ────────────────────────

    [Fact]
    public async Task GetByUser_KnownUser_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.SupervisorToken);
        var resp = await client.GetAsync($"/api/student-profiles/by-user/{SeedData.StudentUser.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ── POST /api/student-profiles ────────────────────────────────────────

    [Fact]
    public async Task Create_Coordinator_Returns201()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.CoordinatorToken);
        var resp = await client.PostJsonAsync("/api/student-profiles", new
        {
            userId = SeedData.StudentUser.Id,
            programme = "PhD Computer Science",
            status = "active",
            supervisorId = SeedData.SupervisorUser.Id,
        });
        resp.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task Create_Student_Returns403()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.PostJsonAsync("/api/student-profiles", new
        {
            userId = SeedData.StudentUser.Id,
            programme = "PhD",
            status = "active",
        });
        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // ── PATCH /api/student-profiles/{id} ─────────────────────────────────

    [Fact]
    public async Task Update_Admin_Returns204()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.AdminToken);
        var resp = await client.PatchJsonAsync(
            $"/api/student-profiles/{SeedData.Profile.Id}",
            new { thesisTitle = "Updated Thesis Title" });
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Update_Supervisor_Returns204()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.SupervisorToken);
        var resp = await client.PatchJsonAsync(
            $"/api/student-profiles/{SeedData.Profile.Id}",
            new { status = "active" });
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    // ── DELETE /api/student-profiles/{id} ────────────────────────────────

    [Fact]
    public async Task Delete_Admin_Returns204()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.AdminToken);
        var resp = await client.DeleteAsync($"/api/student-profiles/{SeedData.Profile.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Delete_Coordinator_Returns403()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.CoordinatorToken);
        var resp = await client.DeleteAsync($"/api/student-profiles/{SeedData.Profile.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    public void Dispose() => _factory.Dispose();
}
