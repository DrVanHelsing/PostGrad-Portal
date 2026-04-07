using FluentAssertions;
using Moq;
using PostGrad.Api.Models;
using PostGrad.Api.Services;
using PostGrad.Api.SmokeTests.Fixtures;
using System.Net;

namespace PostGrad.Api.SmokeTests.Tests;

/// <summary>
/// Smoke tests for /api/form-templates, /api/form-submissions, /api/form-annotations.
/// </summary>
public class FormsSmokeTests : IDisposable
{
    private readonly ApiFactory _factory;

    private static readonly FormTemplate DraftTemplate = new()
    {
        Id = "tmpl-draft",
        Name = "HDR Form",
        Slug = "hdr-001",
        Status = "draft",
        CreatedBy = "admin-001"
    };

    private static readonly FormSubmission OtherStudentSubmission = new()
    {
        Id = "sub-other",
        TemplateId = "tmpl-001",
        TemplateName = "HDR Form",
        StudentId = "stu-other",
        Status = "draft"
    };

    public FormsSmokeTests()
    {
        _factory = new ApiFactory();

        // Form Templates
        _factory.Firestore
            .Setup(f => f.GetCollectionAsync<FormTemplate>(Collections.FormTemplates))
            .ReturnsAsync([SeedData.Template, DraftTemplate]);

        _factory.Firestore
            .Setup(f => f.GetDocAsync<FormTemplate>(Collections.FormTemplates, SeedData.Template.Id))
            .ReturnsAsync(SeedData.Template);

        _factory.Firestore
            .Setup(f => f.GetDocAsync<FormTemplate>(Collections.FormTemplates, DraftTemplate.Id))
            .ReturnsAsync(DraftTemplate);

        _factory.Firestore
            .Setup(f => f.AddDocAsync(Collections.FormTemplates, It.IsAny<Dictionary<string, object>>()))
            .ReturnsAsync("tmpl-new");

        _factory.Firestore
            .Setup(f => f.GetDocAsync<FormTemplate>(Collections.FormTemplates, "tmpl-new"))
            .ReturnsAsync(DraftTemplate);

        // Form Submissions
        _factory.Firestore
            .Setup(f => f.GetCollectionAsync<FormSubmission>(Collections.FormSubmissions))
            .ReturnsAsync([SeedData.Submission, OtherStudentSubmission]);

        _factory.Firestore
            .Setup(f => f.GetDocAsync<FormSubmission>(Collections.FormSubmissions, SeedData.Submission.Id))
            .ReturnsAsync(SeedData.Submission);

        _factory.Firestore
            .Setup(f => f.GetDocAsync<FormSubmission>(Collections.FormSubmissions, OtherStudentSubmission.Id))
            .ReturnsAsync(OtherStudentSubmission);

        _factory.Firestore
            .Setup(f => f.AddDocAsync(Collections.FormSubmissions, It.IsAny<Dictionary<string, object>>()))
            .ReturnsAsync("sub-new");

        _factory.Firestore
            .Setup(f => f.GetDocAsync<FormSubmission>(Collections.FormSubmissions, "sub-new"))
            .ReturnsAsync(SeedData.Submission);

        // Form Annotations
        _factory.Firestore
            .Setup(f => f.GetCollectionAsync<FormAnnotation>(Collections.FormAnnotations))
            .ReturnsAsync([SeedData.FormAnno]);

        _factory.Firestore
            .Setup(f => f.GetDocAsync<FormAnnotation>(Collections.FormAnnotations, SeedData.FormAnno.Id))
            .ReturnsAsync(SeedData.FormAnno);

        _factory.Firestore
            .Setup(f => f.AddDocAsync(Collections.FormAnnotations, It.IsAny<Dictionary<string, object>>()))
            .ReturnsAsync("fanno-new");

        _factory.Firestore
            .Setup(f => f.GetDocAsync<FormAnnotation>(Collections.FormAnnotations, "fanno-new"))
            .ReturnsAsync(SeedData.FormAnno);

        // Common
        _factory.Firestore
            .Setup(f => f.UpdateDocAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Dictionary<string, object>>()))
            .Returns(Task.CompletedTask);

        _factory.Firestore
            .Setup(f => f.DeleteDocAsync(It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        _factory.Firestore
            .Setup(f => f.AddAuditLogAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>()))
            .Returns(Task.CompletedTask);
    }

    // ── GET /api/form-templates ───────────────────────────────────────────

    [Fact]
    public async Task GetTemplates_AnyAuth_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.GetAsync("/api/form-templates");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetTemplates_Unauthenticated_Returns401()
    {
        var client = _factory.CreateClient();
        var resp = await client.GetAsync("/api/form-templates");
        resp.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetTemplateById_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.GetAsync($"/api/form-templates/{SeedData.Template.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ── POST /api/form-templates ──────────────────────────────────────────

    [Fact]
    public async Task CreateTemplate_Coordinator_Returns201()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.CoordinatorToken);
        var resp = await client.PostJsonAsync("/api/form-templates", new
        {
            name = "New HDR Form",
            code = "HDR-NEW",
            description = "A new form",
            category = "hdr",
            sections = Array.Empty<object>(),
        });
        resp.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task CreateTemplate_Supervisor_Returns403()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.SupervisorToken);
        var resp = await client.PostJsonAsync("/api/form-templates", new
        {
            name = "Unauthorised Form",
            code = "BAD",
        });
        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // ── PATCH /api/form-templates/{id} ────────────────────────────────────

    [Fact]
    public async Task UpdateTemplate_DraftTemplate_Coordinator_Returns204()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.CoordinatorToken);
        var resp = await client.PatchJsonAsync($"/api/form-templates/{DraftTemplate.Id}",
            new { name = "Updated Name" });
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task UpdateTemplate_PublishedTemplate_Returns400()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.CoordinatorToken);
        var resp = await client.PatchJsonAsync($"/api/form-templates/{SeedData.Template.Id}",
            new { name = "Try to edit published" });
        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ── POST /api/form-templates/{id}/publish ─────────────────────────────

    [Fact]
    public async Task PublishTemplate_Draft_Returns204()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.CoordinatorToken);
        var resp = await client.PostJsonAsync($"/api/form-templates/{DraftTemplate.Id}/publish", new { });
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task PublishTemplate_AlreadyPublished_Returns400()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.CoordinatorToken);
        var resp = await client.PostJsonAsync($"/api/form-templates/{SeedData.Template.Id}/publish", new { });
        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ── POST /api/form-templates/{id}/archive ────────────────────────────

    [Fact]
    public async Task ArchiveTemplate_Admin_Returns204()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.AdminToken);
        var resp = await client.PostJsonAsync($"/api/form-templates/{SeedData.Template.Id}/archive", new { });
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    // ── DELETE /api/form-templates/{id} ──────────────────────────────────

    [Fact]
    public async Task DeleteTemplate_Admin_Returns204()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.AdminToken);
        var resp = await client.DeleteAsync($"/api/form-templates/{SeedData.Template.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task DeleteTemplate_Coordinator_Returns403()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.CoordinatorToken);
        var resp = await client.DeleteAsync($"/api/form-templates/{SeedData.Template.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // ── GET /api/form-submissions ─────────────────────────────────────────

    [Fact]
    public async Task GetSubmissions_Admin_ReturnsAll200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.AdminToken);
        var resp = await client.GetAsync("/api/form-submissions");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetSubmissions_Student_Returns200OwnOnly()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.GetAsync("/api/form-submissions");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ── GET /api/form-submissions/{id} ────────────────────────────────────

    [Fact]
    public async Task GetSubmissionById_OwnSubmission_Student_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.GetAsync($"/api/form-submissions/{SeedData.Submission.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetSubmissionById_OtherStudentSubmission_Student_Returns403()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.GetAsync($"/api/form-submissions/{OtherStudentSubmission.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // ── POST /api/form-submissions ────────────────────────────────────────

    [Fact]
    public async Task CreateSubmission_Student_Returns201()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.PostJsonAsync("/api/form-submissions", new
        {
            templateId = SeedData.Template.Id,
            templateName = SeedData.Template.Name,
            studentId = SeedData.StudentUser.Id,
            studentName = SeedData.StudentUser.Name,
            formData = new Dictionary<string, object>(),
        });
        resp.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    // ── PATCH /api/form-submissions/{id} ──────────────────────────────────

    [Fact]
    public async Task UpdateSubmission_OwnSubmission_Student_Returns204()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.PatchJsonAsync($"/api/form-submissions/{SeedData.Submission.Id}",
            new { status = "submitted" });
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    // ── POST /api/form-submissions/{id}/signatures ────────────────────────

    [Fact]
    public async Task AddSignature_Supervisor_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.SupervisorToken);
        var resp = await client.PostJsonAsync(
            $"/api/form-submissions/{SeedData.Submission.Id}/signatures",
            new
            {
                signerId = SeedData.SupervisorUser.Id,
                signerName = SeedData.SupervisorUser.Name,
                signerRole = "supervisor",
                comment = "Approved",
            });
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ── DELETE /api/form-submissions/{id} ─────────────────────────────────

    [Fact]
    public async Task DeleteSubmission_Admin_Returns204()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.AdminToken);
        var resp = await client.DeleteAsync($"/api/form-submissions/{SeedData.Submission.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    // ── GET /api/form-annotations ─────────────────────────────────────────

    [Fact]
    public async Task GetFormAnnotations_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.SupervisorToken);
        var resp = await client.GetAsync($"/api/form-annotations?submissionId={SeedData.Submission.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetFormAnnotationById_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.SupervisorToken);
        var resp = await client.GetAsync($"/api/form-annotations/{SeedData.FormAnno.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ── POST /api/form-annotations ────────────────────────────────────────

    [Fact]
    public async Task CreateFormAnnotation_Returns201()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.SupervisorToken);
        var resp = await client.PostJsonAsync("/api/form-annotations", new
        {
            submissionId = SeedData.Submission.Id,
            fieldId = "field-2",
            authorId = SeedData.SupervisorUser.Id,
            authorName = SeedData.SupervisorUser.Name,
            authorRole = "supervisor",
            comment = "Please elaborate on this field.",
            status = "open",
        });
        resp.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    // ── PATCH /api/form-annotations/{id} ─────────────────────────────────

    [Fact]
    public async Task UpdateFormAnnotation_Returns204()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.SupervisorToken);
        var resp = await client.PatchJsonAsync($"/api/form-annotations/{SeedData.FormAnno.Id}",
            new { comment = "Updated comment", status = "resolved" });
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    // ── DELETE /api/form-annotations/{id} ────────────────────────────────

    [Fact]
    public async Task DeleteFormAnnotation_Returns204()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.AdminToken);
        var resp = await client.DeleteAsync($"/api/form-annotations/{SeedData.FormAnno.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task FormAnnotation_Unauthenticated_Returns401()
    {
        var client = _factory.CreateClient();
        var resp = await client.GetAsync($"/api/form-annotations/{SeedData.FormAnno.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    public void Dispose() => _factory.Dispose();
}
