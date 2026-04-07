using FluentAssertions;
using Moq;
using PostGrad.Api.Models;
using PostGrad.Api.Services;
using PostGrad.Api.SmokeTests.Fixtures;
using System.Net;

namespace PostGrad.Api.SmokeTests.Tests;

/// <summary>
/// Smoke tests for /api/calendar-events, /api/milestones, /api/notifications.
/// </summary>
public class CalendarMilestoneNotificationSmokeTests : IDisposable
{
    private readonly ApiFactory _factory;

    public CalendarMilestoneNotificationSmokeTests()
    {
        _factory = new ApiFactory();

        // Calendar events
        _factory.Firestore
            .Setup(f => f.GetCollectionAsync<CalendarEvent>(Collections.CalendarEvents))
            .ReturnsAsync([SeedData.CalEvent]);

        _factory.Firestore
            .Setup(f => f.GetDocAsync<CalendarEvent>(Collections.CalendarEvents, SeedData.CalEvent.Id))
            .ReturnsAsync(SeedData.CalEvent);

        _factory.Firestore
            .Setup(f => f.AddDocAsync(Collections.CalendarEvents, It.IsAny<Dictionary<string, object>>()))
            .ReturnsAsync("cal-new");

        _factory.Firestore
            .Setup(f => f.GetDocAsync<CalendarEvent>(Collections.CalendarEvents, "cal-new"))
            .ReturnsAsync(SeedData.CalEvent);

        // Milestones
        _factory.Firestore
            .Setup(f => f.GetCollectionAsync<Milestone>(Collections.Milestones))
            .ReturnsAsync([SeedData.Mile]);

        _factory.Firestore
            .Setup(f => f.GetDocAsync<Milestone>(Collections.Milestones, SeedData.Mile.Id))
            .ReturnsAsync(SeedData.Mile);

        _factory.Firestore
            .Setup(f => f.QueryAsync<Milestone>(Collections.Milestones,
                It.IsAny<(string, string, object)[]>()))
            .ReturnsAsync([SeedData.Mile]);

        _factory.Firestore
            .Setup(f => f.AddDocAsync(Collections.Milestones, It.IsAny<Dictionary<string, object>>()))
            .ReturnsAsync("mile-new");

        _factory.Firestore
            .Setup(f => f.GetDocAsync<Milestone>(Collections.Milestones, "mile-new"))
            .ReturnsAsync(SeedData.Mile);

        // Notifications — covers both single and multi-filter calls (GetAll, UnreadCount, MarkAllRead)
        _factory.Firestore
            .Setup(f => f.QueryAsync<Notification>(
                Collections.Notifications,
                It.IsAny<(string, string, object)[]>()))
            .ReturnsAsync([SeedData.Notif]);

        _factory.Firestore
            .Setup(f => f.GetDocAsync<Notification>(Collections.Notifications, SeedData.Notif.Id))
            .ReturnsAsync(SeedData.Notif);

        _factory.Firestore
            .Setup(f => f.AddDocAsync(Collections.Notifications, It.IsAny<Dictionary<string, object>>()))
            .ReturnsAsync("notif-new");

        // Common update/delete
        _factory.Firestore
            .Setup(f => f.UpdateDocAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Dictionary<string, object>>()))
            .Returns(Task.CompletedTask);

        _factory.Firestore
            .Setup(f => f.DeleteDocAsync(It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        _factory.Firestore
            .Setup(f => f.AddAuditLogAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>()))
            .Returns(Task.CompletedTask);

        _factory.Firestore
            .Setup(f => f.AddNotificationAsync(It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>()))
            .Returns(Task.CompletedTask);
    }

    // ── Calendar Events ───────────────────────────────────────────────────────

    [Fact]
    public async Task GetCalendarEvents_AnyRole_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.GetAsync("/api/calendar-events");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetCalendarEvent_KnownId_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.GetAsync($"/api/calendar-events/{SeedData.CalEvent.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task CreateCalendarEvent_AnyAuthorized_Returns201()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.SupervisorToken);
        var resp = await client.PostJsonAsync("/api/calendar-events", new
        {
            title = "New Meeting",
            date = DateTime.UtcNow.AddDays(5),
            type = "meeting",
            scope = "personal",
            createdBy = SeedData.SupervisorUser.Id,
        });
        resp.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task UpdateCalendarEvent_AdminCanUpdate_Returns204()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.AdminToken);
        var resp = await client.PatchJsonAsync($"/api/calendar-events/{SeedData.CalEvent.Id}",
            new { title = "Updated Title" });
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task DeleteCalendarEvent_Admin_Returns204()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.AdminToken);
        var resp = await client.DeleteAsync($"/api/calendar-events/{SeedData.CalEvent.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task CalendarEvent_Unauthenticated_Returns401()
    {
        var client = _factory.CreateClient();
        var resp = await client.GetAsync("/api/calendar-events");
        resp.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ── Milestones ────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetMilestones_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.GetAsync("/api/milestones");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetMilestonesForStudent_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.SupervisorToken);
        var resp = await client.GetAsync($"/api/milestones/student/{SeedData.StudentUser.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetMilestone_KnownId_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.GetAsync($"/api/milestones/{SeedData.Mile.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task CreateMilestone_Returns201()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.SupervisorToken);
        var resp = await client.PostJsonAsync("/api/milestones", new
        {
            studentId = SeedData.StudentUser.Id,
            title = "Literature Review",
            type = "submission",
            date = DateTime.UtcNow.AddMonths(1),
        });
        resp.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task DeleteMilestone_Admin_Returns204()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.AdminToken);
        var resp = await client.DeleteAsync($"/api/milestones/{SeedData.Mile.Id}");
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    // ── Notifications ─────────────────────────────────────────────────────────

    [Fact]
    public async Task GetMyNotifications_Student_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.GetAsync("/api/notifications");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetUnreadCount_Student_Returns200()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.GetAsync("/api/notifications/unread-count");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await resp.ReadJsonAsync<Dictionary<string, object>>();
        body.Should().ContainKey("count");
    }

    [Fact]
    public async Task MarkNotificationRead_Student_Returns204()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.PostJsonAsync(
            $"/api/notifications/{SeedData.Notif.Id}/read", new { });
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task MarkAllRead_Student_Returns204()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.PostJsonAsync("/api/notifications/read-all", new { });
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task CreateNotification_Admin_Returns204()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.AdminToken);
        var resp = await client.PostJsonAsync("/api/notifications", new
        {
            userId = SeedData.StudentUser.Id,
            title = "System Alert",
            message = "Maintenance tonight",
            type = "warning",
        });
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task CreateNotification_Student_Returns403()
    {
        var client = _factory.CreateClientWithToken(TokenHelper.StudentToken);
        var resp = await client.PostJsonAsync("/api/notifications", new
        {
            userId = SeedData.StudentUser.Id,
            title = "Self-notification",
            message = "test",
        });
        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    public void Dispose() => _factory.Dispose();
}
