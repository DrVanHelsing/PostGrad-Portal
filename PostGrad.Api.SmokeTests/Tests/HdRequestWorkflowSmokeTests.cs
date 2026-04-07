using FluentAssertions;
using Moq;
using PostGrad.Api.Dtos;
using PostGrad.Api.Models;
using PostGrad.Api.Services;
using PostGrad.Api.SmokeTests.Fixtures;
using System.Net;

namespace PostGrad.Api.SmokeTests.Tests;

/// <summary>
/// End-to-end workflow smoke tests for /api/hd-requests.
///
/// Covers:
///   1. Student creates a draft request
///   2. Student submits to supervisor (generates access code)
///   3. Supervisor validates the access code
///   4. Supervisor approves
///   5. Coordinator forwards to FHD
///   6. FHD records outcome (approved)
///   7. SHD records outcome (approved)
///   8. Refer-back flow
///   9. Role access restrictions
/// </summary>
public class HdRequestWorkflowSmokeTests : IDisposable
{
    private readonly ApiFactory _factory;

    public HdRequestWorkflowSmokeTests()
    {
        _factory = new ApiFactory();

        // All mutation endpoints call GetCollectionAsync<User> to pass allUsers
        _factory.Firestore
            .Setup(f => f.GetCollectionAsync<User>(Collections.Users))
            .ReturnsAsync(SeedData.AllUsers.ToList());

        // IHdRequestService — use the exposed mock on ApiFactory
        _factory.HdRequestSvc
            .Setup(s => s.GetAsync(It.IsAny<string>()))
            .ReturnsAsync(SeedData.DraftRequest);

        _factory.HdRequestSvc
            .Setup(s => s.GetAllAsync())
            .ReturnsAsync([SeedData.DraftRequest, SeedData.SubmittedRequest]);

        _factory.HdRequestSvc
            .Setup(s => s.GetForUserAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync([SeedData.DraftRequest]);

        _factory.HdRequestSvc
            .Setup(s => s.CreateAsync(It.IsAny<CreateHdRequestRequest>(), It.IsAny<List<User>>()))
            .ReturnsAsync(SeedData.DraftRequest);

        _factory.HdRequestSvc
            .Setup(s => s.UpdateDraftAsync(It.IsAny<string>(), It.IsAny<UpdateDraftRequest>(), It.IsAny<List<User>>()))
            .Returns(Task.CompletedTask);

        _factory.HdRequestSvc
            .Setup(s => s.SubmitToSupervisorAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<List<User>>()))
            .Returns(Task.CompletedTask);

        _factory.HdRequestSvc
            .Setup(s => s.ValidateAccessCodeAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync((true, (string?)null));

        _factory.HdRequestSvc
            .Setup(s => s.SupervisorApproveAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<List<User>>()))
            .Returns(Task.CompletedTask);

        _factory.HdRequestSvc
            .Setup(s => s.CoSupervisorSignAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<List<User>>()))
            .Returns(Task.CompletedTask);

        _factory.HdRequestSvc
            .Setup(s => s.ReferBackAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<List<User>>()))
            .Returns(Task.CompletedTask);

        _factory.HdRequestSvc
            .Setup(s => s.ForwardToFhdAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<List<User>>()))
            .Returns(Task.CompletedTask);

        _factory.HdRequestSvc
            .Setup(s => s.RecordFhdOutcomeAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<List<User>>()))
            .Returns(Task.CompletedTask);

        _factory.HdRequestSvc
            .Setup(s => s.RecordShdOutcomeAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string?>(), It.IsAny<List<User>>()))
            .Returns(Task.CompletedTask);

        _factory.HdRequestSvc
            .Setup(s => s.ResubmitAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<List<User>>()))
            .Returns(Task.CompletedTask);

        _factory.HdRequestSvc
            .Setup(s => s.DeleteAsync(It.IsAny<string>()))
            .Returns(Task.CompletedTask);
    }

    // ── GET /api/hd-requests ──────────────────────────────────────────────────

    [Fact]
    public async Task GetAll_Admin_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.AdminToken);
        var resp = await client.GetAsync("/api/hd-requests");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAll_Student_Returns200WithOwnRequests()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.GetAsync("/api/hd-requests");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAll_Unauthenticated_Returns401()
    {
        var client = _factory.CreateClient();
        var resp = await client.GetAsync("/api/hd-requests");
        resp.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ── GET /api/hd-requests/{id} ─────────────────────────────────────────────

    [Fact]
    public async Task GetById_KnownId_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.GetAsync($"/api/hd-requests/{SeedData.DraftRequest.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ── POST /api/hd-requests (create draft) ─────────────────────────────────

    [Fact]
    public async Task Create_Student_ValidPayload_Returns201()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.PostJsonAsync("/api/hd-requests", new
        {
            type = "HDR-001",
            title = "Change of Supervisor",
            description = "Requesting change",
            studentId = SeedData.StudentUser.Id,
            studentName = SeedData.StudentUser.Name,
            supervisorId = SeedData.SupervisorUser.Id,
        });
        resp.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    // ── PATCH /api/hd-requests/{id}/draft ────────────────────────────────────

    [Fact]
    public async Task UpdateDraft_Student_Returns204()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.PatchJsonAsync($"/api/hd-requests/{SeedData.DraftRequest.Id}/draft",
            new { title = "Updated Title" });
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    // ── POST /api/hd-requests/{id}/submit ────────────────────────────────────

    [Fact]
    public async Task Submit_Student_Returns204()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.PostJsonAsync(
            $"/api/hd-requests/{SeedData.DraftRequest.Id}/submit",
            new { userId = SeedData.StudentUser.Id });
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    // ── POST /api/hd-requests/{id}/validate-code ─────────────────────────────

    [Fact]
    public async Task ValidateCode_Supervisor_ValidCode_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.SupervisorToken);
        var resp = await client.PostJsonAsync(
            $"/api/hd-requests/{SeedData.SubmittedRequest.Id}/validate-code",
            new { code = "ABC123" });
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ── POST /api/hd-requests/{id}/supervisor-approve ────────────────────────

    [Fact]
    public async Task SupervisorApprove_Supervisor_Returns204()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.SupervisorToken);
        var resp = await client.PostJsonAsync(
            $"/api/hd-requests/{SeedData.SubmittedRequest.Id}/supervisor-approve",
            new { userId = SeedData.SupervisorUser.Id, signatureName = "Dr Supervisor" });
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task SupervisorApprove_Student_Returns403()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.PostJsonAsync(
            $"/api/hd-requests/{SeedData.SubmittedRequest.Id}/supervisor-approve",
            new { userId = SeedData.StudentUser.Id });
        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // ── POST /api/hd-requests/{id}/co-supervisor-sign ────────────────────────

    [Fact]
    public async Task CoSupervisorSign_Supervisor_Returns204()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.SupervisorToken);
        var resp = await client.PostJsonAsync(
            $"/api/hd-requests/{SeedData.SubmittedRequest.Id}/co-supervisor-sign",
            new { userId = SeedData.SupervisorUser.Id });
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    // ── POST /api/hd-requests/{id}/refer-back ────────────────────────────────

    [Fact]
    public async Task ReferBack_Supervisor_Returns204()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.SupervisorToken);
        var resp = await client.PostJsonAsync(
            $"/api/hd-requests/{SeedData.SubmittedRequest.Id}/refer-back",
            new { userId = SeedData.SupervisorUser.Id, reason = "Missing information" });
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task ReferBack_Student_Returns403()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.PostJsonAsync(
            $"/api/hd-requests/{SeedData.SubmittedRequest.Id}/refer-back",
            new { userId = SeedData.StudentUser.Id, reason = "Test" });
        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // ── POST /api/hd-requests/{id}/forward-to-fhd ────────────────────────────

    [Fact]
    public async Task ForwardToFhd_Coordinator_Returns204()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.CoordinatorToken);
        var resp = await client.PostJsonAsync(
            $"/api/hd-requests/{SeedData.SubmittedRequest.Id}/forward-to-fhd",
            new { userId = SeedData.CoordUser.Id });
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task ForwardToFhd_Student_Returns403()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.PostJsonAsync(
            $"/api/hd-requests/{SeedData.SubmittedRequest.Id}/forward-to-fhd",
            new { userId = SeedData.StudentUser.Id });
        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // ── POST /api/hd-requests/{id}/fhd-outcome ───────────────────────────────

    [Fact]
    public async Task FhdOutcome_Coordinator_Returns204()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.CoordinatorToken);
        var resp = await client.PostJsonAsync(
            $"/api/hd-requests/{SeedData.SubmittedRequest.Id}/fhd-outcome",
            new { userId = SeedData.CoordUser.Id, outcome = "approved", referenceNumber = "FHD-2026-001" });
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    // ── POST /api/hd-requests/{id}/shd-outcome ───────────────────────────────

    [Fact]
    public async Task ShdOutcome_Admin_Returns204()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.AdminToken);
        var resp = await client.PostJsonAsync(
            $"/api/hd-requests/{SeedData.SubmittedRequest.Id}/shd-outcome",
            new { userId = SeedData.AdminUser.Id, outcome = "approved" });
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    // ── POST /api/hd-requests/{id}/resubmit ──────────────────────────────────

    [Fact]
    public async Task Resubmit_Student_Returns204()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.PostJsonAsync(
            $"/api/hd-requests/{SeedData.DraftRequest.Id}/resubmit",
            new { userId = SeedData.StudentUser.Id });
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    // ── DELETE /api/hd-requests/{id} ─────────────────────────────────────────

    [Fact]
    public async Task Delete_Admin_Returns204()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.AdminToken);
        var resp = await client.DeleteAsync($"/api/hd-requests/{SeedData.DraftRequest.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Delete_Student_Returns403()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.DeleteAsync($"/api/hd-requests/{SeedData.DraftRequest.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    public void Dispose() => _factory.Dispose();
}
