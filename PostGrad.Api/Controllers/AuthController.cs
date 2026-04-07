using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PostGrad.Api.Dtos;
using PostGrad.Api.Services;
using System.Security.Claims;

namespace PostGrad.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;
    private readonly IFirestoreService _fs;

    public AuthController(IAuthService auth, IFirestoreService fs)
    {
        _auth = auth;
        _fs = fs;
    }

    /// <summary>Login and receive a JWT token.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var (user, error) = await _auth.ValidateCredentialsAsync(req.Email, req.Password);
        if (user == null) return Unauthorized(new { error });

        var token = _auth.GenerateJwtToken(user);
        return Ok(new LoginResponse(token, user.Id, user.Email, user.Name, user.Role, user.MustChangePassword));
    }

    /// <summary>Change the authenticated user's password.</summary>
    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var success = await _auth.ChangePasswordAsync(userId, req.CurrentPassword, req.NewPassword);
        if (!success) return BadRequest(new { error = "Current password is incorrect." });
        return NoContent();
    }

    /// <summary>Request a password reset (sets mustChangePassword flag, generates temp password).</summary>
    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest req)
    {
        var users = await _fs.QueryAsync<Models.User>(Collections.Users, ("email", "==", req.Email.Trim().ToLowerInvariant()));
        var user = users.FirstOrDefault();
        // Don't reveal whether user exists
        if (user != null)
        {
            var tempPwd = _auth.GenerateTemporaryPassword();
            await _fs.UpdateDocAsync(Collections.Users, user.Id, new Dictionary<string, object>
            {
                { "generatedPassword", tempPwd },
                { "mustChangePassword", true },
            });
        }
        return Ok(new { message = "If the email exists, a reset has been initiated." });
    }

    /// <summary>Return the current authenticated user's profile.</summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var user = await _fs.GetDocAsync<Models.User>(Collections.Users, userId);
        if (user == null) return NotFound();
        return Ok(user);
    }
}
