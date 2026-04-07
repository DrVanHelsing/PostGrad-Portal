using Google.Cloud.Firestore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PostGrad.Api.Dtos;
using PostGrad.Api.Models;
using PostGrad.Api.Services;
using System.Security.Claims;

namespace PostGrad.Api.Controllers;

[ApiController]
[Route("api/calendar-events")]
[Authorize]
public class CalendarEventsController : ControllerBase
{
    private readonly IFirestoreService _fs;

    public CalendarEventsController(IFirestoreService fs) => _fs = fs;

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _fs.GetCollectionAsync<CalendarEvent>(Collections.CalendarEvents));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var ev = await _fs.GetDocAsync<CalendarEvent>(Collections.CalendarEvents, id);
        return ev == null ? NotFound() : Ok(ev);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCalendarEventRequest req)
    {
        var data = new Dictionary<string, object>
        {
            { "title", req.Title },
            { "date", Timestamp.FromDateTime(req.Date.ToUniversalTime()) },
            { "type", req.Type },
            { "scope", req.Scope },
            { "createdBy", req.CreatedBy },
        };
        if (req.Time != null) data["time"] = req.Time;
        if (req.Description != null) data["description"] = req.Description;
        if (req.TargetUserIds?.Count > 0) data["targetUserIds"] = req.TargetUserIds;

        var id = await _fs.AddDocAsync(Collections.CalendarEvents, data);
        await _fs.AddAuditLogAsync(req.CreatedBy, "", "Created Calendar Event", "CalendarEvent", id, $"Created event: {req.Title}");

        // Notify target users
        if (req.TargetUserIds != null)
        {
            foreach (var uid in req.TargetUserIds.Where(u => u != req.CreatedBy))
                await _fs.AddNotificationAsync(uid, "New Calendar Event", $"A new event \"{req.Title}\" has been added to your calendar.", "info", "/dashboard");
        }

        var created = await _fs.GetDocAsync<CalendarEvent>(Collections.CalendarEvents, id);
        return CreatedAtAction(nameof(GetById), new { id }, created);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateCalendarEventRequest req)
    {
        var ev = await _fs.GetDocAsync<CalendarEvent>(Collections.CalendarEvents, id);
        if (ev == null) return NotFound();

        var fields = new Dictionary<string, object>();
        if (req.Title != null) fields["title"] = req.Title;
        if (req.Date.HasValue) fields["date"] = Timestamp.FromDateTime(req.Date.Value.ToUniversalTime());
        if (req.Time != null) fields["time"] = req.Time;
        if (req.Type != null) fields["type"] = req.Type;
        if (req.Scope != null) fields["scope"] = req.Scope;
        if (req.Description != null) fields["description"] = req.Description;

        if (fields.Count > 0) await _fs.UpdateDocAsync(Collections.CalendarEvents, id, fields);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var ev = await _fs.GetDocAsync<CalendarEvent>(Collections.CalendarEvents, id);
        if (ev == null) return NotFound();
        await _fs.DeleteDocAsync(Collections.CalendarEvents, id);
        return NoContent();
    }
}

// ─────────────────────────────────────────────────────

[ApiController]
[Route("api/milestones")]
[Authorize]
public class MilestonesController : ControllerBase
{
    private readonly IFirestoreService _fs;

    public MilestonesController(IFirestoreService fs) => _fs = fs;

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _fs.GetCollectionAsync<Milestone>(Collections.Milestones));

    [HttpGet("student/{studentId}")]
    public async Task<IActionResult> GetByStudent(string studentId)
    {
        var items = await _fs.QueryAsync<Milestone>(Collections.Milestones, ("studentId", "==", studentId));
        return Ok(items);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var m = await _fs.GetDocAsync<Milestone>(Collections.Milestones, id);
        return m == null ? NotFound() : Ok(m);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateMilestoneRequest req)
    {
        var data = new Dictionary<string, object>
        {
            { "studentId", req.StudentId },
            { "title", req.Title },
            { "type", req.Type },
            { "date", Timestamp.FromDateTime(req.Date.ToUniversalTime()) },
        };
        if (req.Description != null) data["description"] = req.Description;

        var id = await _fs.AddDocAsync(Collections.Milestones, data);
        await _fs.AddAuditLogAsync(req.StudentId, "", "Added Milestone", "Milestone", id, $"Added milestone: {req.Title}");

        var created = await _fs.GetDocAsync<Milestone>(Collections.Milestones, id);
        return CreatedAtAction(nameof(GetById), new { id }, created);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateMilestoneRequest req)
    {
        var m = await _fs.GetDocAsync<Milestone>(Collections.Milestones, id);
        if (m == null) return NotFound();

        var fields = new Dictionary<string, object>();
        if (req.Title != null) fields["title"] = req.Title;
        if (req.Type != null) fields["type"] = req.Type;
        if (req.Date.HasValue) fields["date"] = Timestamp.FromDateTime(req.Date.Value.ToUniversalTime());
        if (req.Description != null) fields["description"] = req.Description;

        if (fields.Count > 0) await _fs.UpdateDocAsync(Collections.Milestones, id, fields);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var m = await _fs.GetDocAsync<Milestone>(Collections.Milestones, id);
        if (m == null) return NotFound();
        await _fs.DeleteDocAsync(Collections.Milestones, id);
        return NoContent();
    }
}

// ─────────────────────────────────────────────────────

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly IFirestoreService _fs;

    public NotificationsController(IFirestoreService fs) => _fs = fs;

    [HttpGet]
    public async Task<IActionResult> GetMine()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var items = await _fs.QueryAsync<Notification>(Collections.Notifications, ("userId", "==", userId));
        return Ok(items.OrderByDescending(n => n.CreatedAt));
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> UnreadCount()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var items = await _fs.QueryAsync<Notification>(Collections.Notifications, ("userId", "==", userId), ("read", "==", false));
        return Ok(new { count = items.Count });
    }

    [HttpPost("{id}/read")]
    public async Task<IActionResult> MarkRead(string id)
    {
        await _fs.UpdateDocAsync(Collections.Notifications, id, new Dictionary<string, object> { { "read", true } });
        return NoContent();
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var unread = await _fs.QueryAsync<Notification>(Collections.Notifications, ("userId", "==", userId), ("read", "==", false));
        foreach (var n in unread)
            await _fs.UpdateDocAsync(Collections.Notifications, n.Id, new Dictionary<string, object> { { "read", true } });
        return NoContent();
    }

    [HttpPost]
    [Authorize(Roles = "admin,coordinator")]
    public async Task<IActionResult> Create([FromBody] CreateNotificationRequest req)
    {
        await _fs.AddNotificationAsync(req.UserId, req.Title, req.Message, req.Type, req.Link);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        await _fs.DeleteDocAsync(Collections.Notifications, id);
        return NoContent();
    }
}
