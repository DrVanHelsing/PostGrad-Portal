using System.ComponentModel.DataAnnotations;

namespace PostGrad.Api.Dtos;

// ─── Auth ─────────────────────────────────────────
public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password);

public record LoginResponse(
    string Token,
    string UserId,
    string Email,
    string Name,
    string Role,
    bool MustChangePassword);

public record ChangePasswordRequest(
    [Required] string CurrentPassword,
    [Required, MinLength(8)] string NewPassword);

public record ResetPasswordRequest(
    [Required, EmailAddress] string Email);

// ─── Users ────────────────────────────────────────
public record CreateUserRequest(
    [Required, EmailAddress] string Email,
    [Required] string Name,
    [Required] string Role,
    string? FirstName,
    string? Surname,
    string? Title,
    string? StudentNumber,
    string? Programme,
    string? Organization,
    List<string>? Permissions,
    string? GeneratedPassword);

public record UpdateUserRequest(
    string? Name,
    string? Email,
    string? FirstName,
    string? Surname,
    string? Title,
    string? Role,
    string? Programme,
    string? ResearchTitle,
    string? Organization,
    List<string>? Permissions,
    bool? MustChangePassword,
    string? GeneratedPassword,
    Dictionary<string, object>? NotificationPrefs);

public record UpdateRoleRequest([Required] string Role);

// ─── HD Requests ──────────────────────────────────
public record CreateHdRequestRequest(
    [Required] string Type,
    [Required] string Title,
    string Description,
    [Required] string StudentId,
    [Required] string StudentName,
    [Required] string SupervisorId,
    string? CoordinatorId,
    string? CoSupervisorId,
    List<HdDocumentDto>? Documents,
    string? StudentDepartment,
    string? StudentFaculty,
    string? StudentProgramme);

public record HdDocumentDto(string Name, string? Url, string? Type);

public record SubmitToSupervisorRequest([Required] string UserId);
public record ValidateAccessCodeRequest([Required] string Code);
public record SupervisorApproveRequest([Required] string UserId, string? SignatureName);
public record CoSupervisorSignRequest([Required] string UserId, string? SignatureName);
public record ReferBackRequest([Required] string UserId, [Required] string Reason);
public record ForwardToFhdRequest([Required] string UserId, string? SignatureName);
public record RecordFhdOutcomeRequest([Required] string UserId, [Required] string Outcome, string? ReferenceNumber, string? Reason);
public record RecordShdOutcomeRequest([Required] string UserId, [Required] string Outcome, string? Reason);
public record ResubmitRequest([Required] string UserId);
public record UpdateDraftRequest(string? Title, string? Description, string? Type, List<HdDocumentDto>? Documents);

// ─── Calendar Events ──────────────────────────────
public record CreateCalendarEventRequest(
    [Required] string Title,
    [Required] DateTime Date,
    string? Time,
    [Required] string Type,
    [Required] string Scope,
    string? Description,
    [Required] string CreatedBy,
    List<string>? TargetUserIds);

public record UpdateCalendarEventRequest(
    string? Title,
    DateTime? Date,
    string? Time,
    string? Type,
    string? Scope,
    string? Description);

// ─── Milestones ───────────────────────────────────
public record CreateMilestoneRequest(
    [Required] string StudentId,
    [Required] string Title,
    [Required] string Type,
    [Required] DateTime Date,
    string? Description);

public record UpdateMilestoneRequest(
    string? Title,
    string? Type,
    DateTime? Date,
    string? Description);

// ─── Student Profiles ─────────────────────────────
public record UpdateStudentProfileRequest(
    string? ThesisTitle,
    string? Status,
    string? CoSupervisorId,
    string? NominalSupervisorId,
    string? Programme,
    string? Degree,
    string? ResearchTitle,
    string? SupervisorId,
    string? SupervisorName);

// ─── Notifications ────────────────────────────────
public record CreateNotificationRequest(
    [Required] string UserId,
    [Required] string Title,
    [Required] string Message,
    string Type = "info",
    string? Link = null);

// ─── User Profile ─────────────────────────────────
public record UpdateProfileRequest(
    string? Name,
    string? FirstName,
    string? Surname,
    string? Title,
    string? Programme,
    string? ResearchTitle,
    Dictionary<string, object>? NotificationPrefs);

// ─── Document Versions ────────────────────────────
public record CreateVersionRequest(
    [Required] string RequestId,
    [Required] int Version,
    List<VersionDocumentDto>? Documents,
    [Required] string SubmittedBy,
    [Required] string SubmitterName,
    string? SubmitterRole,
    string? ChangeNotes);

public record VersionDocumentDto(string Name, string? Url, string? Type, long? Size);

public record AddCommentRequest(
    [Required] string AuthorId,
    [Required] string AuthorName,
    [Required] string AuthorRole,
    [Required] string Text);

public record AddFeedbackRequest(
    [Required] string AuthorId,
    [Required] string Section,
    [Required] string Comment);

public record UpdateFeedbackStatusRequest([Required] string Status);

// ─── Annotations ──────────────────────────────────
public record CreateAnnotationRequest(
    [Required] string VersionId,
    [Required] string RequestId,
    string? DocumentName,
    string? SelectedText,
    [Required] string Comment,
    int? PageNumber,
    [Required] string AuthorId,
    [Required] string AuthorName,
    [Required] string AuthorRole,
    string? HighlightColor,
    string? Status);

public record UpdateAnnotationRequest(string? Comment, string? Status, string? HighlightColor);

// ─── Form Templates ───────────────────────────────
public record FormFieldDto(
    string? Id,
    string? Label,
    string? Type,
    bool Required = false,
    string? Placeholder = null,
    List<string>? Options = null,
    string? HelpText = null);

public record FormSectionDto(
    string? Id,
    string? Title,
    string? Description,
    List<FormFieldDto>? Fields);

public record CreateFormTemplateRequest(
    [Required] string Name,
    [Required] string Code,
    string? Category,
    string? Description,
    List<FormSectionDto>? Sections);

public record UpdateFormTemplateRequest(
    string? Name,
    string? Description,
    string? Category,
    List<FormSectionDto>? Sections);

// ─── Form Submissions ─────────────────────────────
public record CreateFormSubmissionRequest(
    [Required] string TemplateId,
    string? TemplateName,
    string? StudentId,
    string? StudentName,
    Dictionary<string, object>? FormData);

public record UpdateFormSubmissionRequest(
    Dictionary<string, object>? FormData,
    string? Status);

public record AddSignatureRequest(
    [Required] string SignerId,
    [Required] string SignerName,
    [Required] string SignerRole,
    string? Comment);

// ─── Form Annotations ─────────────────────────────
public record CreateFormAnnotationRequest(
    [Required] string SubmissionId,
    [Required] string FieldId,
    [Required] string AuthorId,
    [Required] string AuthorName,
    [Required] string AuthorRole,
    [Required] string Comment,
    string? Status = null);

public record UpdateFormAnnotationRequest(
    string? Comment,
    string? Status);

// ─── Nudge ────────────────────────────────────────
public record NudgeStudentRequest(
    [Required] string StudentId,
    [Required] string SupervisorId,
    string? Message);

// ─── Analytics ────────────────────────────────────
public record AnalyticsQuery(
    DateTime? From,
    DateTime? To,
    string? Department,
    string? Programme);
