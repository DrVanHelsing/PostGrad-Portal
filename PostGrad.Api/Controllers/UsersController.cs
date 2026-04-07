using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PostGrad.Api.Dtos;
using PostGrad.Api.Models;
using PostGrad.Api.Services;
using System.Security.Claims;

namespace PostGrad.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IFirestoreService _fs;
    private readonly IAuthService _auth;

    public UsersController(IFirestoreService fs, IAuthService auth)
    {
        _fs = fs;
        _auth = auth;
    }

    /// <summary>Get all users. Admin/Coordinator only.</summary>
    [HttpGet]
    [Authorize(Roles = "admin,coordinator")]
    public async Task<IActionResult> GetAll() =>
        Ok(await _fs.GetCollectionAsync<User>(Collections.Users));

    /// <summary>Get a single user by ID.</summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var user = await _fs.GetDocAsync<User>(Collections.Users, id);
        return user == null ? NotFound() : Ok(user);
    }

    /// <summary>Get users by role.</summary>
    [HttpGet("by-role/{role}")]
    [Authorize(Roles = "admin,coordinator,supervisor")]
    public async Task<IActionResult> GetByRole(string role)
    {
        var users = await _fs.QueryAsync<User>(Collections.Users, ("role", "==", role));
        return Ok(users);
    }

    /// <summary>Create a new user. Admin only.</summary>
    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest req)
    {
        var id = Guid.NewGuid().ToString();
        var tempPwd = req.GeneratedPassword ?? _auth.GenerateTemporaryPassword();

        var data = new Dictionary<string, object>
        {
            { "email", req.Email.Trim().ToLowerInvariant() },
            { "name", req.Name },
            { "role", req.Role },
            { "generatedPassword", tempPwd },
            { "mustChangePassword", true },
        };
        if (req.FirstName != null) data["firstName"] = req.FirstName;
        if (req.Surname != null) data["surname"] = req.Surname;
        if (req.Title != null) data["title"] = req.Title;
        if (req.StudentNumber != null) data["studentNumber"] = req.StudentNumber;
        if (req.Programme != null) data["programme"] = req.Programme;
        if (req.Organization != null) data["organization"] = req.Organization;
        if (req.Permissions?.Count > 0) data["permissions"] = req.Permissions;

        await _fs.SetDocAsync(Collections.Users, id, data);

        var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "system";
        var adminName = User.FindFirstValue(ClaimTypes.Name) ?? "Admin";
        await _fs.AddAuditLogAsync(adminId, adminName, "Created User", "User", id, $"Created user: {req.Name} ({req.Email})");

        var created = await _fs.GetDocAsync<User>(Collections.Users, id);
        return CreatedAtAction(nameof(GetById), new { id }, created);
    }

    /// <summary>Update user fields. Admin only.</summary>
    [HttpPatch("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateUserRequest req)
    {
        var user = await _fs.GetDocAsync<User>(Collections.Users, id);
        if (user == null) return NotFound();

        var fields = new Dictionary<string, object>();
        if (req.Name != null) fields["name"] = req.Name;
        if (req.Email != null) fields["email"] = req.Email.Trim().ToLowerInvariant();
        if (req.FirstName != null) fields["firstName"] = req.FirstName;
        if (req.Surname != null) fields["surname"] = req.Surname;
        if (req.Title != null) fields["title"] = req.Title;
        if (req.Role != null) fields["role"] = req.Role;
        if (req.Programme != null) fields["programme"] = req.Programme;
        if (req.ResearchTitle != null) fields["researchTitle"] = req.ResearchTitle;
        if (req.Organization != null) fields["organization"] = req.Organization;
        if (req.Permissions != null) fields["permissions"] = req.Permissions;
        if (req.MustChangePassword.HasValue) fields["mustChangePassword"] = req.MustChangePassword.Value;
        if (req.GeneratedPassword != null) fields["generatedPassword"] = req.GeneratedPassword;
        if (req.NotificationPrefs != null) fields["notificationPrefs"] = req.NotificationPrefs;

        if (fields.Count == 0) return BadRequest(new { error = "No fields to update." });
        await _fs.UpdateDocAsync(Collections.Users, id, fields);

        var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "system";
        var adminName = User.FindFirstValue(ClaimTypes.Name) ?? "Admin";
        await _fs.AddAuditLogAsync(adminId, adminName, "Updated User", "User", id, $"Updated user: {id}");

        return NoContent();
    }

    /// <summary>Update a user's role. Admin only.</summary>
    [HttpPatch("{id}/role")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> UpdateRole(string id, [FromBody] UpdateRoleRequest req)
    {
        var user = await _fs.GetDocAsync<User>(Collections.Users, id);
        if (user == null) return NotFound();
        await _fs.UpdateDocAsync(Collections.Users, id, new Dictionary<string, object> { { "role", req.Role } });

        var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "system";
        var adminName = User.FindFirstValue(ClaimTypes.Name) ?? "Admin";
        await _fs.AddAuditLogAsync(adminId, adminName, "Role Changed", "User", id, $"Changed role to {req.Role}");

        return NoContent();
    }

    /// <summary>Delete a user. Admin only.</summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(string id)
    {
        var user = await _fs.GetDocAsync<User>(Collections.Users, id);
        if (user == null) return NotFound();
        await _fs.DeleteDocAsync(Collections.Users, id);

        var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "system";
        var adminName = User.FindFirstValue(ClaimTypes.Name) ?? "Admin";
        await _fs.AddAuditLogAsync(adminId, adminName, "Deleted User", "User", id, $"Deleted user {id}");

        return NoContent();
    }

    /// <summary>Update the current user's own profile.</summary>
    [HttpPatch("me/profile")]
    public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateProfileRequest req)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var fields = new Dictionary<string, object>();
        if (req.Name != null) fields["name"] = req.Name;
        if (req.FirstName != null) fields["firstName"] = req.FirstName;
        if (req.Surname != null) fields["surname"] = req.Surname;
        if (req.Title != null) fields["title"] = req.Title;
        if (req.Programme != null) fields["programme"] = req.Programme;
        if (req.ResearchTitle != null) fields["researchTitle"] = req.ResearchTitle;
        if (req.NotificationPrefs != null) fields["notificationPrefs"] = req.NotificationPrefs;

        if (fields.Count > 0) await _fs.UpdateDocAsync(Collections.Users, userId, fields);
        return NoContent();
    }

    /// <summary>Nudge a student (supervisor sends reminder). Supervisor/Coordinator/Admin.</summary>
    [HttpPost("{studentId}/nudge")]
    [Authorize(Roles = "supervisor,coordinator,admin")]
    public async Task<IActionResult> Nudge(string studentId, [FromBody] NudgeStudentRequest req)
    {
        var supervisorId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var supervisorName = User.FindFirstValue(ClaimTypes.Name)!;
        var message = req.Message ?? $"{supervisorName} is requesting your attention on pending items.";
        await _fs.AddNotificationAsync(studentId, "Reminder from Supervisor", message, "warning", "/requests");
        await _fs.AddAuditLogAsync(supervisorId, supervisorName, "Nudged Student", "User", studentId, "Sent reminder to student");
        return NoContent();
    }
}
