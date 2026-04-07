using FluentAssertions;
using Moq;
using PostGrad.Api.Models;
using PostGrad.Api.Services;
using PostGrad.Api.SmokeTests.Fixtures;
using System.Net;

namespace PostGrad.Api.SmokeTests.Tests;

/// <summary>Smoke tests for /api/document-versions and /api/annotations.</summary>
public class DocumentVersionsAndAnnotationsSmokeTests : IDisposable
{
    private readonly ApiFactory _factory;

    public DocumentVersionsAndAnnotationsSmokeTests()
    {
        _factory = new ApiFactory();

        // Document Versions
        _factory.Firestore
            .Setup(f => f.QueryAsync<DocumentVersion>(Collections.DocumentVersions,
                It.IsAny<(string, string, object)[]>()))
            .ReturnsAsync([SeedData.DocVersion]);

        _factory.Firestore
            .Setup(f => f.GetDocAsync<DocumentVersion>(Collections.DocumentVersions, SeedData.DocVersion.Id))
            .ReturnsAsync(SeedData.DocVersion);

        _factory.Firestore
            .Setup(f => f.AddDocAsync(Collections.DocumentVersions, It.IsAny<Dictionary<string, object>>()))
            .ReturnsAsync("ver-new");

        _factory.Firestore
            .Setup(f => f.GetDocAsync<DocumentVersion>(Collections.DocumentVersions, "ver-new"))
            .ReturnsAsync(SeedData.DocVersion);

        // Annotations
        _factory.Firestore
            .Setup(f => f.QueryAsync<Annotation>(Collections.Annotations,
                It.IsAny<(string, string, object)[]>()))
            .ReturnsAsync([SeedData.Anno]);

        _factory.Firestore
            .Setup(f => f.GetDocAsync<Annotation>(Collections.Annotations, SeedData.Anno.Id))
            .ReturnsAsync(SeedData.Anno);

        _factory.Firestore
            .Setup(f => f.AddDocAsync(Collections.Annotations, It.IsAny<Dictionary<string, object>>()))
            .ReturnsAsync("ann-new");

        _factory.Firestore
            .Setup(f => f.GetDocAsync<Annotation>(Collections.Annotations, "ann-new"))
            .ReturnsAsync(SeedData.Anno);

        // Common
        _factory.Firestore
            .Setup(f => f.UpdateDocAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Dictionary<string, object>>()))
            .Returns(Task.CompletedTask);

        _factory.Firestore
            .Setup(f => f.DeleteDocAsync(It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);
    }

    // ── GET /api/document-versions/request/{requestId} ───────────────────

    [Fact]
    public async Task GetForRequest_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.GetAsync($"/api/document-versions/request/{SeedData.DraftRequest.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ── GET /api/document-versions/{id} ──────────────────────────────────

    [Fact]
    public async Task GetById_KnownId_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.GetAsync($"/api/document-versions/{SeedData.DocVersion.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetById_UnknownId_Returns404()
    {
        _factory.Firestore
            .Setup(f => f.GetDocAsync<DocumentVersion>(Collections.DocumentVersions, "no-id"))
            .ReturnsAsync((DocumentVersion?)null);

        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.GetAsync("/api/document-versions/no-id");
        resp.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetDocVersion_Unauthenticated_Returns401()
    {
        var client = _factory.CreateClient();
        var resp = await client.GetAsync($"/api/document-versions/{SeedData.DocVersion.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ── POST /api/document-versions ──────────────────────────────────────

    [Fact]
    public async Task Create_Student_Returns201()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.PostJsonAsync("/api/document-versions", new
        {
            requestId = SeedData.DraftRequest.Id,
            version = 1,
            submittedBy = SeedData.StudentUser.Id,
            submitterName = SeedData.StudentUser.Name,
            submitterRole = "student",
            documents = new[] { new { name = "thesis.pdf", url = "/files/thesis.pdf", type = "pdf", size = 100 } },
        });
        resp.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    // ── POST /api/document-versions/{id}/comments ────────────────────────

    [Fact]
    public async Task AddComment_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.SupervisorToken);
        var resp = await client.PostJsonAsync(
            $"/api/document-versions/{SeedData.DocVersion.Id}/comments",
            new
            {
                authorId = SeedData.SupervisorUser.Id,
                authorName = SeedData.SupervisorUser.Name,
                authorRole = "supervisor",
                text = "Great work overall.",
            });
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ── POST /api/document-versions/{id}/feedback ────────────────────────

    [Fact]
    public async Task AddFeedback_Supervisor_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.SupervisorToken);
        var resp = await client.PostJsonAsync(
            $"/api/document-versions/{SeedData.DocVersion.Id}/feedback",
            new
            {
                authorId = SeedData.SupervisorUser.Id,
                section = "Introduction",
                comment = "Needs more detail.",
            });
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task AddFeedback_Student_Returns403()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.PostJsonAsync(
            $"/api/document-versions/{SeedData.DocVersion.Id}/feedback",
            new { authorId = SeedData.StudentUser.Id, section = "Intro", comment = "Self-feedback" });
        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // ── PATCH /api/document-versions/{versionId}/feedback/{feedbackId}/status

    [Fact]
    public async Task UpdateFeedbackStatus_Returns204()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.SupervisorToken);
        var resp = await client.PatchJsonAsync(
            $"/api/document-versions/{SeedData.DocVersion.Id}/feedback/fb-001/status",
            new { status = "resolved" });
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    // ── DELETE /api/document-versions/{id} ───────────────────────────────

    [Fact]
    public async Task Delete_Admin_Returns204()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.AdminToken);
        var resp = await client.DeleteAsync($"/api/document-versions/{SeedData.DocVersion.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Delete_Student_Returns403()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.DeleteAsync($"/api/document-versions/{SeedData.DocVersion.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // ── GET /api/annotations/version/{versionId} ─────────────────────────

    [Fact]
    public async Task GetAnnotationsByVersion_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.SupervisorToken);
        var resp = await client.GetAsync($"/api/annotations/version/{SeedData.DocVersion.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ── GET /api/annotations/{id} ────────────────────────────────────────

    [Fact]
    public async Task GetAnnotationById_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.SupervisorToken);
        var resp = await client.GetAsync($"/api/annotations/{SeedData.Anno.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAnnotation_Unauthenticated_Returns401()
    {
        var client = _factory.CreateClient();
        var resp = await client.GetAsync($"/api/annotations/{SeedData.Anno.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ── POST /api/annotations ────────────────────────────────────────────

    [Fact]
    public async Task CreateAnnotation_Supervisor_Returns201()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.SupervisorToken);
        var resp = await client.PostJsonAsync("/api/annotations", new
        {
            versionId = SeedData.DocVersion.Id,
            requestId = SeedData.DraftRequest.Id,
            comment = "This section needs expansion.",
            authorId = SeedData.SupervisorUser.Id,
            authorName = SeedData.SupervisorUser.Name,
            authorRole = "supervisor",
        });
        resp.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    // ── PATCH /api/annotations/{id} ──────────────────────────────────────

    [Fact]
    public async Task UpdateAnnotation_Returns204()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.SupervisorToken);
        var resp = await client.PatchJsonAsync(
            $"/api/annotations/{SeedData.Anno.Id}",
            new { comment = "Revised comment", status = "resolved" });
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    // ── DELETE /api/annotations/{id} ─────────────────────────────────────

    [Fact]
    public async Task DeleteAnnotation_Returns204()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.AdminToken);
        var resp = await client.DeleteAsync($"/api/annotations/{SeedData.Anno.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    public void Dispose() => _factory.Dispose();
}
