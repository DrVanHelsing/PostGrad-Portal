using Google.Cloud.Firestore;
using PostGrad.Api.Models;
using PostGrad.Api.Dtos;

namespace PostGrad.Api.Services;

public interface IHdRequestService
{
    Task<HdRequest?> GetAsync(string id);
    Task<List<HdRequest>> GetAllAsync();
    Task<List<HdRequest>> GetForUserAsync(string userId, string role);
    Task<HdRequest> CreateAsync(CreateHdRequestRequest req, List<User> allUsers);
    Task UpdateDraftAsync(string id, UpdateDraftRequest req, List<User> allUsers);
    Task SubmitToSupervisorAsync(string id, string userId, List<User> allUsers);
    Task<(bool valid, string? error)> ValidateAccessCodeAsync(string id, string code);
    Task SupervisorApproveAsync(string id, string userId, string? signatureName, List<User> allUsers);
    Task CoSupervisorSignAsync(string id, string userId, string? signatureName, List<User> allUsers);
    Task ReferBackAsync(string id, string userId, string reason, List<User> allUsers);
    Task ForwardToFhdAsync(string id, string userId, string? signatureName, List<User> allUsers);
    Task RecordFhdOutcomeAsync(string id, string userId, string outcome, string? referenceNumber, string? reason, List<User> allUsers);
    Task RecordShdOutcomeAsync(string id, string userId, string outcome, string? reason, List<User> allUsers);
    Task ResubmitAsync(string id, string userId, List<User> allUsers);
    Task DeleteAsync(string id);
}

public class HdRequestService : IHdRequestService
{
    private readonly IFirestoreService _fs;
    private readonly IAuthService _auth;

    public HdRequestService(IFirestoreService fs, IAuthService auth)
    {
        _fs = fs;
        _auth = auth;
    }

    public Task<HdRequest?> GetAsync(string id) =>
        _fs.GetDocAsync<HdRequest>(Collections.HdRequests, id);

    public Task<List<HdRequest>> GetAllAsync() =>
        _fs.GetCollectionAsync<HdRequest>(Collections.HdRequests);

    public async Task<List<HdRequest>> GetForUserAsync(string userId, string role)
    {
        var all = await _fs.GetCollectionAsync<HdRequest>(Collections.HdRequests);
        return role switch
        {
            "student" => all.Where(r => r.StudentId == userId).ToList(),
            "supervisor" => all.Where(r => r.SupervisorId == userId || r.CoSupervisorId == userId).ToList(),
            "coordinator" => all.Where(r => r.CoordinatorId == userId).ToList(),
            _ => all // admin sees all
        };
    }

    public async Task<HdRequest> CreateAsync(CreateHdRequestRequest req, List<User> allUsers)
    {
        var coordinatorId = ResolveCoordinatorId(allUsers, req.CoordinatorId, req.StudentDepartment, req.StudentFaculty, req.StudentProgramme);
        var now = Timestamp.GetCurrentTimestamp();
        var data = new Dictionary<string, object>
        {
            { "type", req.Type },
            { "title", req.Title },
            { "description", req.Description ?? "" },
            { "status", "draft" },
            { "studentId", req.StudentId },
            { "studentName", req.StudentName },
            { "supervisorId", req.SupervisorId },
            { "coordinatorId", coordinatorId },
            { "currentOwner", req.StudentId },
            { "locked", false },
            { "documents", (req.Documents ?? []).Select(d => new Dictionary<string, object> { { "name", d.Name }, { "url", d.Url ?? "" }, { "type", d.Type ?? "" } }).Cast<object>().ToList() },
            { "versions", new List<object> { new Dictionary<string, object> { { "version", 1 }, { "date", now }, { "action", "Created" }, { "by", req.StudentId } } } },
            { "signatures", new List<object>() },
            { "createdAt", now },
            { "updatedAt", now },
        };
        if (req.CoSupervisorId != null) data["coSupervisorId"] = req.CoSupervisorId;
        if (req.StudentDepartment != null) data["studentDepartment"] = req.StudentDepartment;
        if (req.StudentFaculty != null) data["studentFaculty"] = req.StudentFaculty;
        if (req.StudentProgramme != null) data["studentProgramme"] = req.StudentProgramme;

        var id = await _fs.AddDocAsync(Collections.HdRequests, data);
        var user = allUsers.FirstOrDefault(u => u.Id == req.StudentId);
        await _fs.AddAuditLogAsync(req.StudentId, user?.Name ?? req.StudentId, "Created Request", "HDRequest", id, $"Created {req.Title}");

        return (await _fs.GetDocAsync<HdRequest>(Collections.HdRequests, id))!;
    }

    public async Task UpdateDraftAsync(string id, UpdateDraftRequest req, List<User> allUsers)
    {
        var r = await GetAsync(id) ?? throw new KeyNotFoundException("Request not found");
        if (r.Status != "draft") throw new InvalidOperationException("Can only edit draft requests");

        var now = Timestamp.GetCurrentTimestamp();
        var versions = BuildVersionsList(r);
        versions.Add(new Dictionary<string, object> { { "version", versions.Count + 1 }, { "date", now }, { "action", "Edited draft" }, { "by", r.StudentId } });

        var fields = new Dictionary<string, object> { { "updatedAt", now }, { "versions", versions } };
        if (req.Title != null) fields["title"] = req.Title;
        if (req.Description != null) fields["description"] = req.Description;
        if (req.Type != null) fields["type"] = req.Type;
        if (req.Documents != null) fields["documents"] = req.Documents.Select(d => (object)new Dictionary<string, object> { { "name", d.Name }, { "url", d.Url ?? "" }, { "type", d.Type ?? "" } }).ToList();

        await _fs.UpdateDocAsync(Collections.HdRequests, id, fields);
        var user = allUsers.FirstOrDefault(u => u.Id == r.StudentId);
        await _fs.AddAuditLogAsync(r.StudentId, user?.Name ?? r.StudentId, "Edited Draft", "HDRequest", id, $"Edited draft \"{req.Title ?? r.Title}\"");
    }

    public async Task SubmitToSupervisorAsync(string id, string userId, List<User> allUsers)
    {
        var r = await GetAsync(id) ?? throw new KeyNotFoundException("Request not found");
        var code = _auth.GenerateAccessCode();
        var now = Timestamp.GetCurrentTimestamp();
        var nowDt = now.ToDateTime();

        var versions = BuildVersionsList(r);
        versions.Add(new Dictionary<string, object> { { "version", versions.Count + 1 }, { "date", now }, { "action", "Submitted to supervisor" }, { "by", userId } });

        await _fs.UpdateDocAsync(Collections.HdRequests, id, new Dictionary<string, object>
        {
            { "status", "submitted_to_supervisor" },
            { "currentOwner", r.SupervisorId },
            { "accessCode", code },
            { "accessCodeExpiry", Timestamp.FromDateTime(nowDt.AddHours(72).ToUniversalTime()) },
            { "timerStart", now },
            { "timerHours", 48 },
            { "updatedAt", now },
            { "versions", versions },
        });

        var user = allUsers.FirstOrDefault(u => u.Id == userId);
        var sup = allUsers.FirstOrDefault(u => u.Id == r.SupervisorId);
        await _fs.AddAuditLogAsync(userId, user?.Name ?? userId, "Submitted Request", "HDRequest", id, $"Submitted {r.Title} to supervisor");
        await _fs.AddNotificationAsync(r.SupervisorId, "New Request for Review", $"{r.StudentName} submitted \"{r.Title}\" for your review. Code: {code}", "info", "/requests");
        await _fs.AddNotificationAsync(r.StudentId, "Request Submitted", $"Your request \"{r.Title}\" has been submitted to {sup?.Name}", "success", "/progress-tracker");
    }

    public async Task<(bool valid, string? error)> ValidateAccessCodeAsync(string id, string code)
    {
        var r = await GetAsync(id);
        if (r == null) return (false, "Request not found");
        if (string.IsNullOrEmpty(r.AccessCode)) return (false, "No access code set");
        if (r.AccessCode != code.ToUpperInvariant()) return (false, "Invalid access code");
        if (r.AccessCodeExpiry.HasValue && DateTime.UtcNow > r.AccessCodeExpiry.Value.ToUniversalTime()) return (false, "Access code has expired");

        if (r.Status == "submitted_to_supervisor")
        {
            var now = Timestamp.GetCurrentTimestamp();
            var versions = BuildVersionsList(r);
            versions.Add(new Dictionary<string, object> { { "version", versions.Count + 1 }, { "date", now }, { "action", "Access code validated – supervisor review started" }, { "by", r.CurrentOwner } });
            await _fs.UpdateDocAsync(Collections.HdRequests, id, new Dictionary<string, object>
            {
                { "status", "supervisor_review" },
                { "updatedAt", now },
                { "versions", versions },
            });
            await _fs.AddAuditLogAsync(r.CurrentOwner, "", "Opened Request", "HDRequest", id, "Validated access code and opened request for review");
        }
        return (true, null);
    }

    public async Task SupervisorApproveAsync(string id, string userId, string? signatureName, List<User> allUsers)
    {
        var r = await GetAsync(id) ?? throw new KeyNotFoundException("Request not found");
        var user = allUsers.FirstOrDefault(u => u.Id == userId);
        var now = Timestamp.GetCurrentTimestamp();
        var nowDt = now.ToDateTime();

        var signatures = BuildSignaturesList(r);
        signatures.Add(new Dictionary<string, object> { { "role", "supervisor" }, { "userId", userId }, { "name", signatureName ?? user?.Name ?? userId }, { "date", now } });
        var versions = BuildVersionsList(r);

        if (!string.IsNullOrEmpty(r.CoSupervisorId) && !r.Signatures.Any(s => s.Role == "co-supervisor"))
        {
            var newCode = _auth.GenerateAccessCode();
            versions.Add(new Dictionary<string, object> { { "version", versions.Count + 1 }, { "date", now }, { "action", "Supervisor approved, forwarded to co-supervisor" }, { "by", userId } });
            await _fs.UpdateDocAsync(Collections.HdRequests, id, new Dictionary<string, object>
            {
                { "status", "co_supervisor_review" }, { "currentOwner", r.CoSupervisorId! },
                { "accessCode", newCode }, { "accessCodeExpiry", Timestamp.FromDateTime(nowDt.AddHours(72).ToUniversalTime()) },
                { "timerStart", now }, { "timerHours", 48 }, { "updatedAt", now },
                { "signatures", signatures }, { "versions", versions },
            });
            await _fs.AddNotificationAsync(r.CoSupervisorId!, "Co-Supervisor Review Required", $"\"{r.Title}\" requires your review. Code: {newCode}", "info", "/requests");
        }
        else
        {
            versions.Add(new Dictionary<string, object> { { "version", versions.Count + 1 }, { "date", now }, { "action", "Supervisor approved, forwarded to coordinator" }, { "by", userId } });
            await _fs.UpdateDocAsync(Collections.HdRequests, id, new Dictionary<string, object>
            {
                { "status", "coordinator_review" }, { "currentOwner", r.CoordinatorId },
                { "accessCode", "" }, { "updatedAt", now }, { "signatures", signatures }, { "versions", versions },
            });
            await _fs.AddNotificationAsync(r.CoordinatorId, "Request Awaiting Review", $"\"{r.Title}\" from {r.StudentName} is ready for coordinator review", "info", "/requests");
        }

        await _fs.AddAuditLogAsync(userId, user?.Name ?? userId, "Approved Request", "HDRequest", id, "Approved and forwarded");
        await _fs.AddNotificationAsync(r.StudentId, "Request Approved by Supervisor", $"Your request \"{r.Title}\" has been approved and forwarded", "success", "/progress-tracker");
    }

    public async Task CoSupervisorSignAsync(string id, string userId, string? signatureName, List<User> allUsers)
    {
        var r = await GetAsync(id) ?? throw new KeyNotFoundException("Request not found");
        var user = allUsers.FirstOrDefault(u => u.Id == userId);
        var now = Timestamp.GetCurrentTimestamp();

        var signatures = BuildSignaturesList(r);
        signatures.Add(new Dictionary<string, object> { { "role", "co-supervisor" }, { "userId", userId }, { "name", signatureName ?? user?.Name ?? userId }, { "date", now } });
        var versions = BuildVersionsList(r);
        versions.Add(new Dictionary<string, object> { { "version", versions.Count + 1 }, { "date", now }, { "action", "Co-supervisor signed, forwarded to coordinator" }, { "by", userId } });

        await _fs.UpdateDocAsync(Collections.HdRequests, id, new Dictionary<string, object>
        {
            { "status", "coordinator_review" }, { "currentOwner", r.CoordinatorId },
            { "accessCode", "" }, { "updatedAt", now }, { "signatures", signatures }, { "versions", versions },
        });

        await _fs.AddAuditLogAsync(userId, user?.Name ?? userId, "Co-Supervisor Signed", "HDRequest", id, "Co-supervisor signed and forwarded to coordinator");
        await _fs.AddNotificationAsync(r.CoordinatorId, "Request Ready for Review", $"\"{r.Title}\" has been signed by all supervisors", "info", "/requests");
        await _fs.AddNotificationAsync(r.StudentId, "Co-Supervisor Signed", $"Your request \"{r.Title}\" has been signed by the co-supervisor", "success", "/progress-tracker");
    }

    public async Task ReferBackAsync(string id, string userId, string reason, List<User> allUsers)
    {
        var r = await GetAsync(id) ?? throw new KeyNotFoundException("Request not found");
        var user = allUsers.FirstOrDefault(u => u.Id == userId);
        var now = Timestamp.GetCurrentTimestamp();
        var nowDt = now.ToDateTime();

        var versions = BuildVersionsList(r);
        versions.Add(new Dictionary<string, object> { { "version", versions.Count + 1 }, { "date", now }, { "action", $"Referred back: {reason}" }, { "by", userId } });

        await _fs.UpdateDocAsync(Collections.HdRequests, id, new Dictionary<string, object>
        {
            { "status", "referred_back" }, { "currentOwner", r.StudentId },
            { "referredBackReason", reason }, { "referredBackBy", userId },
            { "referredBackDate", now }, { "notes", reason }, { "accessCode", "" },
            { "timerStart", now }, { "timerHours", 24 }, { "updatedAt", now }, { "versions", versions },
        });

        await _fs.AddAuditLogAsync(userId, user?.Name ?? userId, "Referred Back", "HDRequest", id, $"Request referred back: {reason}");
        await _fs.AddNotificationAsync(r.StudentId, "Request Referred Back", $"Your request \"{r.Title}\" has been referred back: {reason}", "error", "/requests");
        if (r.SupervisorId != userId)
            await _fs.AddNotificationAsync(r.SupervisorId, "Request Referred Back", $"\"{r.Title}\" for {r.StudentName} has been referred back", "warning", "/requests");
    }

    public async Task ForwardToFhdAsync(string id, string userId, string? signatureName, List<User> allUsers)
    {
        var r = await GetAsync(id) ?? throw new KeyNotFoundException("Request not found");
        var user = allUsers.FirstOrDefault(u => u.Id == userId);
        var now = Timestamp.GetCurrentTimestamp();

        var signatures = BuildSignaturesList(r);
        signatures.Add(new Dictionary<string, object> { { "role", "coordinator" }, { "userId", userId }, { "name", signatureName ?? user?.Name ?? userId }, { "date", now } });
        var versions = BuildVersionsList(r);
        versions.Add(new Dictionary<string, object> { { "version", versions.Count + 1 }, { "date", now }, { "action", "Coordinator signed, forwarded to Faculty Board" }, { "by", userId } });

        await _fs.UpdateDocAsync(Collections.HdRequests, id, new Dictionary<string, object>
        {
            { "status", "fhd_pending" }, { "locked", true }, { "updatedAt", now },
            { "signatures", signatures }, { "versions", versions },
        });

        await _fs.AddAuditLogAsync(userId, user?.Name ?? userId, "Forwarded to Faculty Board", "HDRequest", id, "Signed and forwarded to FHD");
        await _fs.AddNotificationAsync(r.StudentId, "Request at Faculty Board", $"Your request \"{r.Title}\" is now with the Faculty Higher Degrees Committee", "info", "/progress-tracker");
    }

    public async Task RecordFhdOutcomeAsync(string id, string userId, string outcome, string? referenceNumber, string? reason, List<User> allUsers)
    {
        var r = await GetAsync(id) ?? throw new KeyNotFoundException("Request not found");
        var user = allUsers.FirstOrDefault(u => u.Id == userId);
        var now = Timestamp.GetCurrentTimestamp();
        var nowDt = now.ToDateTime();

        var versions = BuildVersionsList(r);
        var updates = new Dictionary<string, object> { { "fhdOutcome", outcome }, { "updatedAt", now } };
        if (referenceNumber != null) updates["referenceNumber"] = referenceNumber;

        if (outcome == "approved")
        {
            updates["status"] = "shd_pending";
            updates["shdOutcome"] = "approved";
            versions.Add(new Dictionary<string, object> { { "version", versions.Count + 1 }, { "date", now }, { "action", $"Faculty Board Approved (Ref: {referenceNumber}). Senate Board auto-approved." }, { "by", userId } });
            await _fs.AddAuditLogAsync(userId, user?.Name ?? userId, "Faculty Board Approved", "HDRequest", id, $"FHD approved with ref {referenceNumber}");
        }
        else if (outcome == "recommended")
        {
            updates["status"] = "shd_pending";
            versions.Add(new Dictionary<string, object> { { "version", versions.Count + 1 }, { "date", now }, { "action", $"Faculty Board Recommended (Ref: {referenceNumber}). Awaiting Senate Board." }, { "by", userId } });
            await _fs.AddAuditLogAsync(userId, user?.Name ?? userId, "Faculty Board Recommended", "HDRequest", id, $"FHD recommended with ref {referenceNumber}");
        }
        else if (outcome == "referred_back")
        {
            updates["status"] = "referred_back";
            updates["currentOwner"] = r.SupervisorId;
            updates["referredBackReason"] = reason ?? "";
            updates["referredBackBy"] = userId;
            updates["referredBackDate"] = now;
            updates["notes"] = reason ?? "";
            updates["timerStart"] = now;
            updates["timerHours"] = 24;
            versions.Add(new Dictionary<string, object> { { "version", versions.Count + 1 }, { "date", now }, { "action", $"Faculty Board Referred Back: {reason}" }, { "by", userId } });
            await _fs.AddAuditLogAsync(userId, user?.Name ?? userId, "Faculty Board Referred Back", "HDRequest", id, $"Referred back from FHD: {reason}");
            await _fs.AddNotificationAsync(r.SupervisorId, "Faculty Board Referred Back", $"\"{r.Title}\" referred back by Faculty Board. 24 hours to amend.", "error", "/requests");
        }

        updates["versions"] = versions;
        await _fs.UpdateDocAsync(Collections.HdRequests, id, updates);
        await _fs.AddNotificationAsync(r.StudentId, "Faculty Board Decision", $"Faculty Board outcome for \"{r.Title}\": {outcome.Replace("_", " ")}", outcome == "referred_back" ? "error" : "success", "/progress-tracker");
    }

    public async Task RecordShdOutcomeAsync(string id, string userId, string outcome, string? reason, List<User> allUsers)
    {
        var r = await GetAsync(id) ?? throw new KeyNotFoundException("Request not found");
        var user = allUsers.FirstOrDefault(u => u.Id == userId);
        var now = Timestamp.GetCurrentTimestamp();
        var nowDt = now.ToDateTime();

        var versions = BuildVersionsList(r);
        var updates = new Dictionary<string, object> { { "shdOutcome", outcome }, { "updatedAt", now } };

        if (outcome == "approved")
        {
            updates["status"] = "approved";
            updates["locked"] = true;
            versions.Add(new Dictionary<string, object> { { "version", versions.Count + 1 }, { "date", now }, { "action", "Senate Board Approved – Request complete" }, { "by", userId } });
            await _fs.AddAuditLogAsync(userId, user?.Name ?? userId, "Final Approval", "HDRequest", id, "Senate Board approved – request fully approved");
            await _fs.AddNotificationAsync(r.StudentId, "Request Approved", $"Your request \"{r.Title}\" has been fully approved by the Senate Board", "success", "/progress-tracker");
        }
        else
        {
            updates["status"] = "referred_back";
            updates["currentOwner"] = r.SupervisorId;
            updates["referredBackReason"] = reason ?? "";
            updates["referredBackBy"] = userId;
            updates["referredBackDate"] = now;
            updates["timerStart"] = now;
            updates["timerHours"] = 24;
            versions.Add(new Dictionary<string, object> { { "version", versions.Count + 1 }, { "date", now }, { "action", $"Senate Board Referred Back: {reason}" }, { "by", userId } });
            await _fs.AddAuditLogAsync(userId, user?.Name ?? userId, "Senate Board Referred Back", "HDRequest", id, $"Referred back from Senate Board: {reason}");
            await _fs.AddNotificationAsync(r.SupervisorId, "Senate Board Referred Back", $"\"{r.Title}\" referred back by the Senate Board. 24 hours to amend.", "error", "/requests");
            await _fs.AddNotificationAsync(r.StudentId, "Senate Board Referred Back", $"The Senate Board referred back \"{r.Title}\": {reason}", "error", "/progress-tracker");
        }

        updates["versions"] = versions;
        await _fs.UpdateDocAsync(Collections.HdRequests, id, updates);
    }

    public async Task ResubmitAsync(string id, string userId, List<User> allUsers)
    {
        var r = await GetAsync(id) ?? throw new KeyNotFoundException("Request not found");
        var user = allUsers.FirstOrDefault(u => u.Id == userId);
        var now = Timestamp.GetCurrentTimestamp();
        var nowDt = now.ToDateTime();
        var code = _auth.GenerateAccessCode();

        var versions = BuildVersionsList(r);
        versions.Add(new Dictionary<string, object> { { "version", versions.Count + 1 }, { "date", now }, { "action", "Resubmitted after referral" }, { "by", userId } });

        await _fs.UpdateDocAsync(Collections.HdRequests, id, new Dictionary<string, object>
        {
            { "status", "submitted_to_supervisor" }, { "currentOwner", r.SupervisorId },
            { "referredBackReason", "" }, { "notes", "" },
            { "accessCode", code }, { "accessCodeExpiry", Timestamp.FromDateTime(nowDt.AddHours(72).ToUniversalTime()) },
            { "timerStart", now }, { "timerHours", 48 }, { "updatedAt", now }, { "versions", versions },
        });

        await _fs.AddAuditLogAsync(userId, user?.Name ?? userId, "Resubmitted Request", "HDRequest", id, $"Resubmitted \"{r.Title}\" after referral");
        await _fs.AddNotificationAsync(r.SupervisorId, "Request Resubmitted", $"{r.StudentName} resubmitted \"{r.Title}\". Code: {code}", "info", "/requests");
    }

    public Task DeleteAsync(string id) =>
        _fs.DeleteDocAsync(Collections.HdRequests, id);

    // ─── Private helpers ──────────────────────────

    private static List<object> BuildVersionsList(HdRequest r) =>
        r.Versions.Select(v => (object)new Dictionary<string, object>
        {
            { "version", v.Version }, { "date", Timestamp.FromDateTime(v.Date.ToUniversalTime()) },
            { "action", v.Action }, { "by", v.By }
        }).ToList();

    private static List<object> BuildSignaturesList(HdRequest r) =>
        r.Signatures.Select(s => (object)new Dictionary<string, object>
        {
            { "role", s.Role }, { "userId", s.UserId }, { "name", s.Name },
            { "date", Timestamp.FromDateTime(s.Date.ToUniversalTime()) }
        }).ToList();

    private static string ResolveCoordinatorId(List<User> allUsers, string? requestedId, string? dept, string? faculty, string? programme)
    {
        if (!string.IsNullOrEmpty(requestedId) && allUsers.Any(u => u.Id == requestedId))
            return requestedId;

        var coordinators = allUsers.Where(u => u.Role == "coordinator").ToList();
        if (coordinators.Count == 0) return requestedId ?? "coordinator-001";
        if (coordinators.Count == 1) return coordinators[0].Id;

        var scored = coordinators.Select(c =>
        {
            int score = 0;
            if (!string.IsNullOrEmpty(dept) && c.Department?.ToLower() == dept.ToLower()) score += 4;
            if (!string.IsNullOrEmpty(faculty) && (c.Department?.ToLower().Contains(faculty.ToLower()) ?? false)) score += 2;
            if (!string.IsNullOrEmpty(programme) && c.Programme?.ToLower() == programme.ToLower()) score += 3;
            return (coordinator: c, score);
        }).OrderByDescending(x => x.score).ToList();

        return scored[0].coordinator.Id;
    }
}
