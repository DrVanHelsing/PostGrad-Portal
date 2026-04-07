using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PostGrad.Api.Dtos;
using PostGrad.Api.Models;
using PostGrad.Api.Services;
using System.Security.Claims;

namespace PostGrad.Api.Controllers;

[ApiController]
[Route("api/hd-requests")]
[Authorize]
public class HdRequestsController : ControllerBase
{
    private readonly IHdRequestService _svc;
    private readonly IFirestoreService _fs;

    public HdRequestsController(IHdRequestService svc, IFirestoreService fs)
    {
        _svc = svc;
        _fs = fs;
    }

    /// <summary>Get all requests visible to the current user.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var role = User.FindFirstValue(ClaimTypes.Role)!;
        var requests = await _svc.GetForUserAsync(userId, role);
        return Ok(requests);
    }

    /// <summary>Get a specific request by ID.</summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var r = await _svc.GetAsync(id);
        return r == null ? NotFound() : Ok(r);
    }

    /// <summary>Create a new HD request (Student).</summary>
    [HttpPost]
    [Authorize(Roles = "student,coordinator,admin")]
    public async Task<IActionResult> Create([FromBody] CreateHdRequestRequest req)
    {
        var allUsers = await _fs.GetCollectionAsync<User>(Collections.Users);
        var created = await _svc.CreateAsync(req, allUsers);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>Edit a draft request.</summary>
    [HttpPatch("{id}/draft")]
    [Authorize(Roles = "student,coordinator,admin")]
    public async Task<IActionResult> UpdateDraft(string id, [FromBody] UpdateDraftRequest req)
    {
        var allUsers = await _fs.GetCollectionAsync<User>(Collections.Users);
        try
        {
            await _svc.UpdateDraftAsync(id, req, allUsers);
            return NoContent();
        }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    /// <summary>Submit a draft to supervisor.</summary>
    [HttpPost("{id}/submit")]
    [Authorize(Roles = "student,coordinator,admin")]
    public async Task<IActionResult> Submit(string id, [FromBody] SubmitToSupervisorRequest req)
    {
        var allUsers = await _fs.GetCollectionAsync<User>(Collections.Users);
        try { await _svc.SubmitToSupervisorAsync(id, req.UserId, allUsers); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    /// <summary>Validate an access code (supervisor opens request).</summary>
    [HttpPost("{id}/validate-code")]
    public async Task<IActionResult> ValidateCode(string id, [FromBody] ValidateAccessCodeRequest req)
    {
        var (valid, error) = await _svc.ValidateAccessCodeAsync(id, req.Code);
        if (!valid) return BadRequest(new { error });
        return Ok(new { valid = true });
    }

    /// <summary>Supervisor approves the request.</summary>
    [HttpPost("{id}/supervisor-approve")]
    [Authorize(Roles = "supervisor,admin")]
    public async Task<IActionResult> SupervisorApprove(string id, [FromBody] SupervisorApproveRequest req)
    {
        var allUsers = await _fs.GetCollectionAsync<User>(Collections.Users);
        try { await _svc.SupervisorApproveAsync(id, req.UserId, req.SignatureName, allUsers); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    /// <summary>Co-supervisor signs the request.</summary>
    [HttpPost("{id}/co-supervisor-sign")]
    [Authorize(Roles = "supervisor,admin")]
    public async Task<IActionResult> CoSupervisorSign(string id, [FromBody] CoSupervisorSignRequest req)
    {
        var allUsers = await _fs.GetCollectionAsync<User>(Collections.Users);
        try { await _svc.CoSupervisorSignAsync(id, req.UserId, req.SignatureName, allUsers); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    /// <summary>Refer a request back to the student.</summary>
    [HttpPost("{id}/refer-back")]
    [Authorize(Roles = "supervisor,coordinator,admin")]
    public async Task<IActionResult> ReferBack(string id, [FromBody] ReferBackRequest req)
    {
        var allUsers = await _fs.GetCollectionAsync<User>(Collections.Users);
        try { await _svc.ReferBackAsync(id, req.UserId, req.Reason, allUsers); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    /// <summary>Coordinator signs and forwards to Faculty Board.</summary>
    [HttpPost("{id}/forward-to-fhd")]
    [Authorize(Roles = "coordinator,admin")]
    public async Task<IActionResult> ForwardToFhd(string id, [FromBody] ForwardToFhdRequest req)
    {
        var allUsers = await _fs.GetCollectionAsync<User>(Collections.Users);
        try { await _svc.ForwardToFhdAsync(id, req.UserId, req.SignatureName, allUsers); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    /// <summary>Record the Faculty Higher Degrees Board outcome.</summary>
    [HttpPost("{id}/fhd-outcome")]
    [Authorize(Roles = "coordinator,admin")]
    public async Task<IActionResult> RecordFhdOutcome(string id, [FromBody] RecordFhdOutcomeRequest req)
    {
        var allUsers = await _fs.GetCollectionAsync<User>(Collections.Users);
        try { await _svc.RecordFhdOutcomeAsync(id, req.UserId, req.Outcome, req.ReferenceNumber, req.Reason, allUsers); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    /// <summary>Record the Senate Higher Degrees Board outcome.</summary>
    [HttpPost("{id}/shd-outcome")]
    [Authorize(Roles = "coordinator,admin")]
    public async Task<IActionResult> RecordShdOutcome(string id, [FromBody] RecordShdOutcomeRequest req)
    {
        var allUsers = await _fs.GetCollectionAsync<User>(Collections.Users);
        try { await _svc.RecordShdOutcomeAsync(id, req.UserId, req.Outcome, req.Reason, allUsers); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    /// <summary>Student resubmits after referral.</summary>
    [HttpPost("{id}/resubmit")]
    [Authorize(Roles = "student,coordinator,admin")]
    public async Task<IActionResult> Resubmit(string id, [FromBody] ResubmitRequest req)
    {
        var allUsers = await _fs.GetCollectionAsync<User>(Collections.Users);
        try { await _svc.ResubmitAsync(id, req.UserId, allUsers); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    /// <summary>Delete a request. Admin only.</summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(string id)
    {
        var r = await _svc.GetAsync(id);
        if (r == null) return NotFound();
        await _svc.DeleteAsync(id);
        return NoContent();
    }
}
