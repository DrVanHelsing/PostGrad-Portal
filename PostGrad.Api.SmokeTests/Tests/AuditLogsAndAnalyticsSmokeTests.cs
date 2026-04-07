using FluentAssertions;
using Moq;
using PostGrad.Api.Models;
using PostGrad.Api.Services;
using PostGrad.Api.SmokeTests.Fixtures;
using System.Net;

namespace PostGrad.Api.SmokeTests.Tests;

/// <summary>Smoke tests for /api/audit-logs and /api/analytics.</summary>
public class AuditLogsAndAnalyticsSmokeTests : IDisposable
{
    private readonly ApiFactory _factory;

    public AuditLogsAndAnalyticsSmokeTests()
    {
        _factory = new ApiFactory();

        // Audit Logs
        _factory.Firestore
            .Setup(f => f.GetCollectionAsync<AuditLog>(Collections.AuditLogs))
            .ReturnsAsync([SeedData.Log1]);

        _factory.Firestore
            .Setup(f => f.GetDocAsync<AuditLog>(Collections.AuditLogs, SeedData.Log1.Id))
            .ReturnsAsync(SeedData.Log1);

        // HD Requests (used by analytics)
        _factory.Firestore
            .Setup(f => f.GetCollectionAsync<HdRequest>(Collections.HdRequests))
            .ReturnsAsync([SeedData.DraftRequest, SeedData.SubmittedRequest]);

        // Users (used by analytics student summary and users-by-role)
        _factory.Firestore
            .Setup(f => f.GetCollectionAsync<User>(Collections.Users))
            .ReturnsAsync(SeedData.AllUsers.ToList());

        // Student profiles (used by analytics)
        _factory.Firestore
            .Setup(f => f.GetCollectionAsync<StudentProfile>(Collections.StudentProfiles))
            .ReturnsAsync([SeedData.Profile]);

        // Form submissions (used by analytics)
        _factory.Firestore
            .Setup(f => f.GetCollectionAsync<FormSubmission>(Collections.FormSubmissions))
            .ReturnsAsync([SeedData.Submission]);
    }

    // ── GET /api/audit-logs ───────────────────────────────────────────────

    [Fact]
    public async Task GetAuditLogs_Admin_Returns200WithPagination()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.AdminToken);
        var resp = await client.GetAsync("/api/audit-logs");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await resp.ReadJsonAsync<Dictionary<string, object>>();
        body.Should().ContainKey("total");
        body.Should().ContainKey("page");
        body.Should().ContainKey("pageSize");
        body.Should().ContainKey("data");
    }

    [Fact]
    public async Task GetAuditLogs_Coordinator_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.CoordinatorToken);
        var resp = await client.GetAsync("/api/audit-logs");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAuditLogs_Supervisor_Returns403()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.SupervisorToken);
        var resp = await client.GetAsync("/api/audit-logs");
        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetAuditLogs_Student_Returns403()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.GetAsync("/api/audit-logs");
        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetAuditLogs_Unauthenticated_Returns401()
    {
        var client = _factory.CreateClient();
        var resp = await client.GetAsync("/api/audit-logs");
        resp.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetAuditLogs_WithUserIdFilter_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.AdminToken);
        var resp = await client.GetAsync($"/api/audit-logs?userId={SeedData.AdminUser.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAuditLogs_WithActionFilter_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.AdminToken);
        var resp = await client.GetAsync("/api/audit-logs?action=user_created");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAuditLogs_WithPagination_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.AdminToken);
        var resp = await client.GetAsync("/api/audit-logs?page=1&pageSize=10");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ── GET /api/audit-logs/{id} ──────────────────────────────────────────

    [Fact]
    public async Task GetAuditLogById_Admin_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.AdminToken);
        var resp = await client.GetAsync($"/api/audit-logs/{SeedData.Log1.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAuditLogById_UnknownId_Returns404()
    {
        _factory.Firestore
            .Setup(f => f.GetDocAsync<AuditLog>(Collections.AuditLogs, "no-log"))
            .ReturnsAsync((AuditLog?)null);

        var client = _factory.CreateClientWithToken(TokenHelper.AdminToken);
        var resp = await client.GetAsync("/api/audit-logs/no-log");
        resp.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── GET /api/analytics/* ─────────────────────────────────────────────

    [Fact]
    public async Task Analytics_RequestsByStatus_Admin_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.AdminToken);
        var resp = await client.GetAsync("/api/analytics/requests/by-status");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Analytics_RequestsByStatus_Student_Returns403()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.GetAsync("/api/analytics/requests/by-status");
        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Analytics_RequestsByStatus_Supervisor_Returns403()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.SupervisorToken);
        var resp = await client.GetAsync("/api/analytics/requests/by-status");
        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Analytics_RequestsByType_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.AdminToken);
        var resp = await client.GetAsync("/api/analytics/requests/by-type");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Analytics_RecentRequests_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.AdminToken);
        var resp = await client.GetAsync("/api/analytics/requests/recent");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Analytics_StudentSummary_Returns200WithExpectedKeys()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.AdminToken);
        var resp = await client.GetAsync("/api/analytics/students/summary");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await resp.ReadJsonAsync<Dictionary<string, object>>();
        body.Should().ContainKey("totalStudents");
        body.Should().ContainKey("requestsApproved");
    }

    [Fact]
    public async Task Analytics_UsersByRole_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.AdminToken);
        var resp = await client.GetAsync("/api/analytics/users/by-role");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Analytics_RecentAuditLogs_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.AdminToken);
        var resp = await client.GetAsync("/api/analytics/audit-logs/recent");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Analytics_FormSubmissionCounts_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.AdminToken);
        var resp = await client.GetAsync("/api/analytics/forms/submission-counts");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Analytics_Coordinator_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.CoordinatorToken);
        var resp = await client.GetAsync("/api/analytics/requests/by-status");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Analytics_Unauthenticated_Returns401()
    {
        var client = _factory.CreateClient();
        var resp = await client.GetAsync("/api/analytics/requests/by-status");
        resp.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    public void Dispose() => _factory.Dispose();
}
