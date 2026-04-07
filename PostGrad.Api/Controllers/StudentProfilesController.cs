using Google.Cloud.Firestore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PostGrad.Api.Dtos;
using PostGrad.Api.Models;
using PostGrad.Api.Services;
using System.Security.Claims;

namespace PostGrad.Api.Controllers;

[ApiController]
[Route("api/student-profiles")]
[Authorize]
public class StudentProfilesController : ControllerBase
{
    private readonly IFirestoreService _fs;

    public StudentProfilesController(IFirestoreService fs) => _fs = fs;

    [HttpGet]
    [Authorize(Roles = "supervisor,coordinator,admin")]
    public async Task<IActionResult> GetAll() =>
        Ok(await _fs.GetCollectionAsync<StudentProfile>(Collections.StudentProfiles));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var p = await _fs.GetDocAsync<StudentProfile>(Collections.StudentProfiles, id);
        return p == null ? NotFound() : Ok(p);
    }

    [HttpGet("by-user/{userId}")]
    public async Task<IActionResult> GetByUserId(string userId)
    {
        var profiles = await _fs.QueryAsync<StudentProfile>(Collections.StudentProfiles, ("userId", "==", userId));
        var profile = profiles.FirstOrDefault();
        return profile == null ? NotFound() : Ok(profile);
    }

    [HttpPost]
    [Authorize(Roles = "admin,coordinator")]
    public async Task<IActionResult> Create([FromBody] StudentProfile req)
    {
        var data = BuildProfileDict(req);
        var id = await _fs.AddDocAsync(Collections.StudentProfiles, data);
        var created = await _fs.GetDocAsync<StudentProfile>(Collections.StudentProfiles, id);
        return CreatedAtAction(nameof(GetById), new { id }, created);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateStudentProfileRequest req)
    {
        var p = await _fs.GetDocAsync<StudentProfile>(Collections.StudentProfiles, id);
        if (p == null) return NotFound();

        var fields = new Dictionary<string, object>();
        if (req.ThesisTitle != null) fields["thesisTitle"] = req.ThesisTitle;
        if (req.Status != null) fields["status"] = req.Status;
        if (req.CoSupervisorId != null) fields["coSupervisorId"] = req.CoSupervisorId;
        if (req.NominalSupervisorId != null) fields["nominalSupervisorId"] = req.NominalSupervisorId;
        if (req.Programme != null) fields["programme"] = req.Programme;
        if (req.Degree != null) fields["degree"] = req.Degree;
        if (req.ResearchTitle != null) fields["researchTitle"] = req.ResearchTitle;

        if (req.SupervisorId != null)
        {
            fields["supervisorId"] = req.SupervisorId;
            var history = p.SupervisorHistory.Select(h => (object)new Dictionary<string, object>
            {
                { "supervisorId", h.SupervisorId }, { "name", h.Name }, { "role", h.Role },
                { "from", Timestamp.FromDateTime(h.From.ToUniversalTime()) },
                { "to", h.To.HasValue ? (object)Timestamp.FromDateTime(h.To.Value.ToUniversalTime()) : null! }
            }).ToList();

            var curr = history.OfType<Dictionary<string, object>>()
                .FirstOrDefault(h => h.ContainsKey("supervisorId") && (string)h["supervisorId"] == p.SupervisorId && h["to"] == null!);
            if (curr != null) curr["to"] = Timestamp.GetCurrentTimestamp();

            history.Add(new Dictionary<string, object>
            {
                { "supervisorId", req.SupervisorId },
                { "name", req.SupervisorName ?? req.SupervisorId },
                { "role", "primary" },
                { "from", Timestamp.GetCurrentTimestamp() },
                { "to", null! }
            });
            fields["supervisorHistory"] = history;
        }

        if (fields.Count > 0) await _fs.UpdateDocAsync(Collections.StudentProfiles, id, fields);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(string id)
    {
        var p = await _fs.GetDocAsync<StudentProfile>(Collections.StudentProfiles, id);
        if (p == null) return NotFound();
        await _fs.DeleteDocAsync(Collections.StudentProfiles, id);
        return NoContent();
    }

    private static Dictionary<string, object> BuildProfileDict(StudentProfile p)
    {
        var data = new Dictionary<string, object>
        {
            { "userId", p.UserId },
            { "studentNumber", p.StudentNumber ?? "" },
            { "programme", p.Programme ?? "" },
            { "degree", p.Degree ?? "" },
            { "yearsRegistered", p.YearsRegistered },
            { "status", p.Status },
            { "supervisorHistory", new List<object>() },
        };
        if (p.RegistrationDate.HasValue) data["registrationDate"] = Timestamp.FromDateTime(p.RegistrationDate.Value.ToUniversalTime());
        if (p.SupervisorId != null) data["supervisorId"] = p.SupervisorId;
        if (p.CoSupervisorId != null) data["coSupervisorId"] = p.CoSupervisorId;
        if (p.NominalSupervisorId != null) data["nominalSupervisorId"] = p.NominalSupervisorId;
        if (p.ThesisTitle != null) data["thesisTitle"] = p.ThesisTitle;
        if (p.ResearchTitle != null) data["researchTitle"] = p.ResearchTitle;
        return data;
    }
}
