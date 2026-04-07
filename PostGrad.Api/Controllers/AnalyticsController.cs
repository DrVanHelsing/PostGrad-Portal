using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PostGrad.Api.Models;
using PostGrad.Api.Services;
using System.Security.Claims;

namespace PostGrad.Api.Controllers;

[ApiController]
[Route("api/audit-logs")]
[Authorize(Roles = "admin,coordinator")]
public class AuditLogsController : ControllerBase
{
    private readonly IFirestoreService _fs;

    public AuditLogsController(IFirestoreService fs) => _fs = fs;

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? userId = null,
        [FromQuery] string? action = null,
        [FromQuery] string? collection = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var logs = await _fs.GetCollectionAsync<AuditLog>(Collections.AuditLogs);

        if (userId != null) logs = logs.Where(l => l.UserId == userId).ToList();
        if (action != null) logs = logs.Where(l => l.Action == action).ToList();
        if (collection != null) logs = logs.Where(l => l.EntityType == collection).ToList();

        var sorted = logs.OrderByDescending(l => l.Timestamp).ToList();
        var total = sorted.Count;
        var paged = sorted.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        return Ok(new { total, page, pageSize, data = paged });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var log = await _fs.GetDocAsync<AuditLog>(Collections.AuditLogs, id);
        return log == null ? NotFound() : Ok(log);
    }
}

// ─────────────────────────────────────────────────────

[ApiController]
[Route("api/analytics")]
[Authorize(Roles = "admin,coordinator")]
public class AnalyticsController : ControllerBase
{
    private readonly IFirestoreService _fs;

    public AnalyticsController(IFirestoreService fs) => _fs = fs;

    [HttpGet("requests/by-status")]
    public async Task<IActionResult> RequestsByStatus()
    {
        var requests = await _fs.GetCollectionAsync<HdRequest>(Collections.HdRequests);
        var grouped = requests
            .GroupBy(r => r.Status)
            .ToDictionary(g => g.Key, g => g.Count());
        return Ok(grouped);
    }

    [HttpGet("requests/by-type")]
    public async Task<IActionResult> RequestsByType()
    {
        var requests = await _fs.GetCollectionAsync<HdRequest>(Collections.HdRequests);
        var grouped = requests
            .GroupBy(r => r.Type ?? "unknown")
            .ToDictionary(g => g.Key, g => g.Count());
        return Ok(grouped);
    }

    [HttpGet("requests/recent")]
    public async Task<IActionResult> RecentRequests([FromQuery] int limit = 10)
    {
        var requests = await _fs.GetCollectionAsync<HdRequest>(Collections.HdRequests);
        var recent = requests
            .OrderByDescending(r => r.UpdatedAt)
            .Take(limit)
            .ToList();
        return Ok(recent);
    }

    [HttpGet("students/summary")]
    public async Task<IActionResult> StudentSummary()
    {
        var users = await _fs.GetCollectionAsync<User>(Collections.Users);
        var students = users.Where(u => u.Role == "student").ToList();
        var profiles = await _fs.GetCollectionAsync<StudentProfile>(Collections.StudentProfiles);
        var requests = await _fs.GetCollectionAsync<HdRequest>(Collections.HdRequests);

        var data = new
        {
            totalStudents = students.Count,
            totalProfiles = profiles.Count,
            requestsSubmitted = requests.Count(r => r.Status != "draft"),
            requestsApproved = requests.Count(r => r.Status == "approved"),
            requestsDraft = requests.Count(r => r.Status == "draft"),
        };
        return Ok(data);
    }

    [HttpGet("users/by-role")]
    public async Task<IActionResult> UsersByRole()
    {
        var users = await _fs.GetCollectionAsync<User>(Collections.Users);
        var grouped = users
            .GroupBy(u => u.Role ?? "unknown")
            .ToDictionary(g => g.Key, g => g.Count());
        return Ok(grouped);
    }

    [HttpGet("audit-logs/recent")]
    public async Task<IActionResult> RecentAuditActivity([FromQuery] int limit = 20)
    {
        var logs = await _fs.GetCollectionAsync<AuditLog>(Collections.AuditLogs);
        var recent = logs.OrderByDescending(l => l.Timestamp).Take(limit).ToList();
        return Ok(recent);
    }

    [HttpGet("forms/submission-counts")]
    public async Task<IActionResult> FormSubmissionCounts()
    {
        var submissions = await _fs.GetCollectionAsync<FormSubmission>(Collections.FormSubmissions);
        var grouped = submissions
            .GroupBy(s => s.Status ?? "unknown")
            .ToDictionary(g => g.Key, g => g.Count());
        return Ok(grouped);
    }
}
