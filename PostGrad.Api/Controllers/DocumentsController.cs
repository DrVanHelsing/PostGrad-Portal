using Google.Cloud.Firestore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PostGrad.Api.Dtos;
using PostGrad.Api.Models;
using PostGrad.Api.Services;
using System.Security.Claims;

namespace PostGrad.Api.Controllers;

[ApiController]
[Route("api/document-versions")]
[Authorize]
public class DocumentVersionsController : ControllerBase
{
    private readonly IFirestoreService _fs;

    public DocumentVersionsController(IFirestoreService fs) => _fs = fs;

    [HttpGet("request/{requestId}")]
    public async Task<IActionResult> GetForRequest(string requestId)
    {
        var versions = await _fs.QueryAsync<DocumentVersion>(Collections.DocumentVersions, ("requestId", "==", requestId));
        return Ok(versions.OrderBy(v => v.Version));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var v = await _fs.GetDocAsync<DocumentVersion>(Collections.DocumentVersions, id);
        return v == null ? NotFound() : Ok(v);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateVersionRequest req)
    {
        var now = Timestamp.GetCurrentTimestamp();
        var data = new Dictionary<string, object>
        {
            { "requestId", req.RequestId },
            { "version", req.Version },
            { "documents", (req.Documents ?? []).Select(d => (object)new Dictionary<string, object> { { "name", d.Name }, { "url", d.Url ?? "" }, { "type", d.Type ?? "" }, { "size", d.Size ?? 0 } }).ToList() },
            { "comments", new List<object>() },
            { "feedback", new List<object>() },
            { "status", "submitted" },
            { "submittedBy", req.SubmittedBy },
            { "submitterName", req.SubmitterName },
            { "submitterRole", req.SubmitterRole ?? "student" },
            { "changeNotes", req.ChangeNotes ?? "" },
            { "submittedAt", now },
            { "updatedAt", now },
        };
        var id = await _fs.AddDocAsync(Collections.DocumentVersions, data);
        var created = await _fs.GetDocAsync<DocumentVersion>(Collections.DocumentVersions, id);
        return CreatedAtAction(nameof(GetById), new { id }, created);
    }

    [HttpPost("{id}/comments")]
    public async Task<IActionResult> AddComment(string id, [FromBody] AddCommentRequest req)
    {
        var v = await _fs.GetDocAsync<DocumentVersion>(Collections.DocumentVersions, id);
        if (v == null) return NotFound();

        var now = Timestamp.GetCurrentTimestamp();
        var comment = new Dictionary<string, object>
        {
            { "id", Guid.NewGuid().ToString() },
            { "authorId", req.AuthorId },
            { "authorName", req.AuthorName },
            { "authorRole", req.AuthorRole },
            { "text", req.Text },
            { "createdAt", now },
        };

        var comments = v.Comments.Select(c => (object)new Dictionary<string, object>
        {
            { "id", c.Id }, { "authorId", c.AuthorId }, { "authorName", c.AuthorName },
            { "authorRole", c.AuthorRole }, { "text", c.Text },
            { "createdAt", Timestamp.FromDateTime(c.CreatedAt.ToUniversalTime()) }
        }).ToList();
        comments.Add(comment);

        await _fs.UpdateDocAsync(Collections.DocumentVersions, id, new Dictionary<string, object>
        {
            { "comments", comments }, { "updatedAt", now },
        });
        return Ok(comment);
    }

    [HttpPost("{id}/feedback")]
    [Authorize(Roles = "supervisor,coordinator,admin")]
    public async Task<IActionResult> AddFeedback(string id, [FromBody] AddFeedbackRequest req)
    {
        var v = await _fs.GetDocAsync<DocumentVersion>(Collections.DocumentVersions, id);
        if (v == null) return NotFound();

        var now = Timestamp.GetCurrentTimestamp();
        var entry = new Dictionary<string, object>
        {
            { "id", Guid.NewGuid().ToString() },
            { "authorId", req.AuthorId },
            { "section", req.Section },
            { "comment", req.Comment },
            { "status", "open" },
            { "createdAt", now },
        };

        var feedback = v.Feedback.Select(f => (object)new Dictionary<string, object>
        {
            { "id", f.Id }, { "authorId", f.AuthorId }, { "section", f.Section },
            { "comment", f.Comment }, { "status", f.Status },
            { "createdAt", Timestamp.FromDateTime(f.CreatedAt.ToUniversalTime()) }
        }).ToList();
        feedback.Add(entry);

        await _fs.UpdateDocAsync(Collections.DocumentVersions, id, new Dictionary<string, object>
        {
            { "feedback", feedback }, { "updatedAt", now },
        });
        return Ok(entry);
    }

    [HttpPatch("{versionId}/feedback/{feedbackId}/status")]
    public async Task<IActionResult> UpdateFeedbackStatus(string versionId, string feedbackId, [FromBody] UpdateFeedbackStatusRequest req)
    {
        var v = await _fs.GetDocAsync<DocumentVersion>(Collections.DocumentVersions, versionId);
        if (v == null) return NotFound();

        var updated = v.Feedback.Select(f => (object)new Dictionary<string, object>
        {
            { "id", f.Id }, { "authorId", f.AuthorId }, { "section", f.Section },
            { "comment", f.Comment }, { "status", f.Id == feedbackId ? req.Status : f.Status },
            { "createdAt", Timestamp.FromDateTime(f.CreatedAt.ToUniversalTime()) }
        }).ToList();

        await _fs.UpdateDocAsync(Collections.DocumentVersions, versionId, new Dictionary<string, object>
        {
            { "feedback", updated }, { "updatedAt", Timestamp.GetCurrentTimestamp() },
        });
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(string id)
    {
        var v = await _fs.GetDocAsync<DocumentVersion>(Collections.DocumentVersions, id);
        if (v == null) return NotFound();
        await _fs.DeleteDocAsync(Collections.DocumentVersions, id);
        return NoContent();
    }
}

// ─────────────────────────────────────────────────────

[ApiController]
[Route("api/annotations")]
[Authorize]
public class AnnotationsController : ControllerBase
{
    private readonly IFirestoreService _fs;

    public AnnotationsController(IFirestoreService fs) => _fs = fs;

    [HttpGet("version/{versionId}")]
    public async Task<IActionResult> GetByVersion(string versionId, [FromQuery] string? documentName = null)
    {
        var annotations = await _fs.QueryAsync<Annotation>(Collections.Annotations, ("versionId", "==", versionId));
        if (documentName != null)
            annotations = annotations.Where(a => MatchesDocument(a.DocumentName, documentName)).ToList();
        return Ok(annotations.OrderBy(a => a.CreatedAt));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var a = await _fs.GetDocAsync<Annotation>(Collections.Annotations, id);
        return a == null ? NotFound() : Ok(a);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAnnotationRequest req)
    {
        var now = Timestamp.GetCurrentTimestamp();
        var data = new Dictionary<string, object>
        {
            { "versionId", req.VersionId },
            { "requestId", req.RequestId },
            { "comment", req.Comment },
            { "authorId", req.AuthorId },
            { "authorName", req.AuthorName },
            { "authorRole", req.AuthorRole },
            { "highlightColor", req.HighlightColor ?? "#ffd43b" },
            { "status", req.Status ?? "draft" },
            { "createdAt", now },
            { "updatedAt", now },
        };
        if (req.DocumentName != null) data["documentName"] = req.DocumentName;
        if (req.SelectedText != null) data["selectedText"] = req.SelectedText;
        if (req.PageNumber.HasValue) data["pageNumber"] = req.PageNumber.Value;

        var id = await _fs.AddDocAsync(Collections.Annotations, data);
        var created = await _fs.GetDocAsync<Annotation>(Collections.Annotations, id);
        return CreatedAtAction(nameof(GetById), new { id }, created);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateAnnotationRequest req)
    {
        var a = await _fs.GetDocAsync<Annotation>(Collections.Annotations, id);
        if (a == null) return NotFound();

        var fields = new Dictionary<string, object> { { "updatedAt", Timestamp.GetCurrentTimestamp() } };
        if (req.Comment != null) fields["comment"] = req.Comment;
        if (req.Status != null) fields["status"] = req.Status;
        if (req.HighlightColor != null) fields["highlightColor"] = req.HighlightColor;

        await _fs.UpdateDocAsync(Collections.Annotations, id, fields);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var a = await _fs.GetDocAsync<Annotation>(Collections.Annotations, id);
        if (a == null) return NotFound();
        await _fs.DeleteDocAsync(Collections.Annotations, id);
        return NoContent();
    }

    private static bool MatchesDocument(string? annotationName, string targetName)
    {
        if (string.IsNullOrEmpty(annotationName)) return true;
        var ann = Normalise(annotationName);
        var tgt = Normalise(targetName);
        return ann == tgt || StripExt(ann) == StripExt(tgt);
    }

    private static string Normalise(string s) =>
        s.Trim().ToLowerInvariant().Replace("-", " ").Replace("_", " ");

    private static string StripExt(string s) =>
        System.Text.RegularExpressions.Regex.Replace(s, @"\.[a-z0-9]+$", "");
}
