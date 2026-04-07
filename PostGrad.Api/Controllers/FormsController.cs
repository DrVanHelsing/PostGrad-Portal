using Google.Cloud.Firestore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PostGrad.Api.Dtos;
using PostGrad.Api.Models;
using PostGrad.Api.Services;
using System.Security.Claims;

namespace PostGrad.Api.Controllers;

[ApiController]
[Route("api/form-templates")]
[Authorize]
public class FormTemplatesController : ControllerBase
{
    private readonly IFirestoreService _fs;

    public FormTemplatesController(IFirestoreService fs) => _fs = fs;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status = null)
    {
        var templates = await _fs.GetCollectionAsync<FormTemplate>(Collections.FormTemplates);
        if (status != null)
            templates = templates.Where(t => t.Status == status).ToList();
        return Ok(templates.OrderByDescending(t => t.UpdatedAt));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var t = await _fs.GetDocAsync<FormTemplate>(Collections.FormTemplates, id);
        return t == null ? NotFound() : Ok(t);
    }

    [HttpPost]
    [Authorize(Roles = "admin,coordinator")]
    public async Task<IActionResult> Create([FromBody] CreateFormTemplateRequest req)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var now = Timestamp.GetCurrentTimestamp();

        var data = new Dictionary<string, object>
        {
            { "name", req.Name },
            { "code", req.Code },
            { "description", req.Description ?? "" },
            { "category", req.Category ?? "general" },
            { "status", "draft" },
            { "version", 1 },
            { "sections", SerializeSections(req.Sections) },
            { "createdBy", userId },
            { "createdAt", now },
            { "updatedAt", now },
        };
        var id = await _fs.AddDocAsync(Collections.FormTemplates, data);
        await _fs.AddAuditLogAsync(userId, userId, "form_template_created", "formTemplates", id, $"name={req.Name}");
        var created = await _fs.GetDocAsync<FormTemplate>(Collections.FormTemplates, id);
        return CreatedAtAction(nameof(GetById), new { id }, created);
    }

    [HttpPatch("{id}")]
    [Authorize(Roles = "admin,coordinator")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateFormTemplateRequest req)
    {
        var t = await _fs.GetDocAsync<FormTemplate>(Collections.FormTemplates, id);
        if (t == null) return NotFound();
        if (t.Status == "published") return BadRequest(new { error = "Cannot edit a published template. Archive it first." });

        var fields = new Dictionary<string, object> { { "updatedAt", Timestamp.GetCurrentTimestamp() } };
        if (req.Name != null) fields["name"] = req.Name;
        if (req.Description != null) fields["description"] = req.Description;
        if (req.Category != null) fields["category"] = req.Category;
        if (req.Sections != null) fields["sections"] = SerializeSections(req.Sections);

        await _fs.UpdateDocAsync(Collections.FormTemplates, id, fields);
        return NoContent();
    }

    [HttpPost("{id}/publish")]
    [Authorize(Roles = "admin,coordinator")]
    public async Task<IActionResult> Publish(string id)
    {
        var t = await _fs.GetDocAsync<FormTemplate>(Collections.FormTemplates, id);
        if (t == null) return NotFound();
        if (t.Status == "published") return BadRequest(new { error = "Already published." });

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        await _fs.UpdateDocAsync(Collections.FormTemplates, id, new Dictionary<string, object>
        {
            { "status", "published" },
            { "publishedAt", Timestamp.GetCurrentTimestamp() },
            { "updatedAt", Timestamp.GetCurrentTimestamp() },
        });
        await _fs.AddAuditLogAsync(userId, userId, "form_template_published", "formTemplates", id, $"name={t.Name}");
        return NoContent();
    }

    [HttpPost("{id}/archive")]
    [Authorize(Roles = "admin,coordinator")]
    public async Task<IActionResult> Archive(string id)
    {
        var t = await _fs.GetDocAsync<FormTemplate>(Collections.FormTemplates, id);
        if (t == null) return NotFound();

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        await _fs.UpdateDocAsync(Collections.FormTemplates, id, new Dictionary<string, object>
        {
            { "status", "archived" },
            { "updatedAt", Timestamp.GetCurrentTimestamp() },
        });
        await _fs.AddAuditLogAsync(userId, userId, "form_template_archived", "formTemplates", id, $"name={t.Name}");
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(string id)
    {
        var t = await _fs.GetDocAsync<FormTemplate>(Collections.FormTemplates, id);
        if (t == null) return NotFound();

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        await _fs.DeleteDocAsync(Collections.FormTemplates, id);
        await _fs.AddAuditLogAsync(userId, userId, "form_template_deleted", "formTemplates", id, $"name={t.Name}");
        return NoContent();
    }

    private static List<object> SerializeSections(IEnumerable<FormSectionDto>? sections)
    {
        if (sections == null) return [];
        return sections.Select(sec => (object)new Dictionary<string, object>
        {
            { "id", sec.Id ?? Guid.NewGuid().ToString() },
            { "title", sec.Title ?? "" },
            { "description", sec.Description ?? "" },
            { "fields", (sec.Fields ?? []).Select(f => (object)new Dictionary<string, object>
                {
                    { "id", f.Id ?? Guid.NewGuid().ToString() },
                    { "label", f.Label ?? "" },
                    { "type", f.Type ?? "text" },
                    { "required", f.Required },
                    { "placeholder", f.Placeholder ?? "" },
                    { "options", f.Options ?? [] },
                    { "helpText", f.HelpText ?? "" },
                }).ToList() },
        }).ToList();
    }
}

// ─────────────────────────────────────────────────────

[ApiController]
[Route("api/form-submissions")]
[Authorize]
public class FormSubmissionsController : ControllerBase
{
    private readonly IFirestoreService _fs;

    public FormSubmissionsController(IFirestoreService fs) => _fs = fs;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? templateId = null, [FromQuery] string? studentId = null)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var role = User.FindFirstValue(ClaimTypes.Role)!;

        var all = await _fs.GetCollectionAsync<FormSubmission>(Collections.FormSubmissions);

        if (role == "student")
            all = all.Where(s => s.StudentId == userId).ToList();
        else if (studentId != null)
            all = all.Where(s => s.StudentId == studentId).ToList();

        if (templateId != null)
            all = all.Where(s => s.TemplateId == templateId).ToList();

        return Ok(all.OrderByDescending(s => s.UpdatedAt));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var s = await _fs.GetDocAsync<FormSubmission>(Collections.FormSubmissions, id);
        if (s == null) return NotFound();

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var role = User.FindFirstValue(ClaimTypes.Role)!;
        if (role == "student" && s.StudentId != userId)
            return Forbid();

        return Ok(s);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateFormSubmissionRequest req)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var now = Timestamp.GetCurrentTimestamp();
        var data = new Dictionary<string, object>
        {
            { "templateId", req.TemplateId },
            { "templateName", req.TemplateName ?? "" },
            { "studentId", req.StudentId ?? userId },
            { "studentName", req.StudentName ?? "" },
            { "status", "draft" },
            { "data", req.FormData ?? new Dictionary<string, object>() },
            { "signatures", new List<object>() },
            { "createdAt", now },
            { "updatedAt", now },
        };
        var id = await _fs.AddDocAsync(Collections.FormSubmissions, data);
        var created = await _fs.GetDocAsync<FormSubmission>(Collections.FormSubmissions, id);
        return CreatedAtAction(nameof(GetById), new { id }, created);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateFormSubmissionRequest req)
    {
        var s = await _fs.GetDocAsync<FormSubmission>(Collections.FormSubmissions, id);
        if (s == null) return NotFound();

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var role = User.FindFirstValue(ClaimTypes.Role)!;
        if (role == "student" && s.StudentId != userId) return Forbid();

        var fields = new Dictionary<string, object> { { "updatedAt", Timestamp.GetCurrentTimestamp() } };
        if (req.FormData != null) fields["data"] = req.FormData;
        if (req.Status != null)
        {
            fields["status"] = req.Status;
            if (req.Status == "submitted") fields["submittedAt"] = Timestamp.GetCurrentTimestamp();
        }

        await _fs.UpdateDocAsync(Collections.FormSubmissions, id, fields);
        return NoContent();
    }

    [HttpPost("{id}/signatures")]
    public async Task<IActionResult> AddSignature(string id, [FromBody] AddSignatureRequest req)
    {
        var s = await _fs.GetDocAsync<FormSubmission>(Collections.FormSubmissions, id);
        if (s == null) return NotFound();

        var now = Timestamp.GetCurrentTimestamp();
        var sig = new Dictionary<string, object>
        {
            { "role", req.SignerRole },
            { "userId", req.SignerId },
            { "name", req.SignerName },
            { "signedAt", now },
            { "signatureData", req.Comment ?? "" },
        };

        var sigs = s.Signatures.Select(x => (object)new Dictionary<string, object>
        {
            { "role", x.Role }, { "userId", x.UserId }, { "name", x.Name },
            { "signedAt", Timestamp.FromDateTime(x.SignedAt.ToUniversalTime()) },
            { "signatureData", x.SignatureData ?? "" },
        }).ToList();
        sigs.Add(sig);

        await _fs.UpdateDocAsync(Collections.FormSubmissions, id, new Dictionary<string, object>
        {
            { "signatures", sigs }, { "updatedAt", now },
        });
        return Ok(sig);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(string id)
    {
        var s = await _fs.GetDocAsync<FormSubmission>(Collections.FormSubmissions, id);
        if (s == null) return NotFound();
        await _fs.DeleteDocAsync(Collections.FormSubmissions, id);
        return NoContent();
    }
}

// ─────────────────────────────────────────────────────

[ApiController]
[Route("api/form-annotations")]
[Authorize]
public class FormAnnotationsController : ControllerBase
{
    private readonly IFirestoreService _fs;

    public FormAnnotationsController(IFirestoreService fs) => _fs = fs;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? submissionId = null, [FromQuery] string? fieldId = null)
    {
        var all = await _fs.GetCollectionAsync<FormAnnotation>(Collections.FormAnnotations);
        if (submissionId != null) all = all.Where(a => a.SubmissionId == submissionId).ToList();
        if (fieldId != null) all = all.Where(a => a.FieldId == fieldId).ToList();
        return Ok(all.OrderBy(a => a.CreatedAt));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var a = await _fs.GetDocAsync<FormAnnotation>(Collections.FormAnnotations, id);
        return a == null ? NotFound() : Ok(a);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateFormAnnotationRequest req)
    {
        var now = Timestamp.GetCurrentTimestamp();
        var data = new Dictionary<string, object>
        {
            { "submissionId", req.SubmissionId },
            { "fieldId", req.FieldId },
            { "authorId", req.AuthorId },
            { "authorName", req.AuthorName },
            { "authorRole", req.AuthorRole },
            { "comment", req.Comment },
            { "status", req.Status ?? "open" },
            { "createdAt", now },
            { "updatedAt", now },
        };
        var id = await _fs.AddDocAsync(Collections.FormAnnotations, data);
        var created = await _fs.GetDocAsync<FormAnnotation>(Collections.FormAnnotations, id);
        return CreatedAtAction(nameof(GetById), new { id }, created);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateFormAnnotationRequest req)
    {
        var a = await _fs.GetDocAsync<FormAnnotation>(Collections.FormAnnotations, id);
        if (a == null) return NotFound();

        var fields = new Dictionary<string, object> { { "updatedAt", Timestamp.GetCurrentTimestamp() } };
        if (req.Comment != null) fields["comment"] = req.Comment;
        if (req.Status != null) fields["status"] = req.Status;

        await _fs.UpdateDocAsync(Collections.FormAnnotations, id, fields);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var a = await _fs.GetDocAsync<FormAnnotation>(Collections.FormAnnotations, id);
        if (a == null) return NotFound();
        await _fs.DeleteDocAsync(Collections.FormAnnotations, id);
        return NoContent();
    }
}
