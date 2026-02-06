using Microsoft.AspNetCore.Mvc;
using BBTips.Domain.Interfaces;

namespace BBTips.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BotsController : ControllerBase
{
    private readonly IBotService _botService;

    public BotsController(IBotService botService)
    {
        _botService = botService;
    }

    [HttpGet]
    public async Task<IActionResult> GetBots()
    {
        var bots = await _botService.GetAllBots();
        return Ok(bots);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetBot(int id)
    {
        var bot = await _botService.GetBotById(id);
        if (bot == null) return NotFound();
        return Ok(bot);
    }

    [HttpPost]
    public async Task<IActionResult> CreateBot([FromBody] CreateBotRequest request)
    {
        var bot = await _botService.CreateBot(request);
        return CreatedAtAction(nameof(GetBot), new { id = bot.Id }, bot);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateBot(int id, [FromBody] UpdateBotRequest request)
    {
        var success = await _botService.UpdateBot(id, request);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBot(int id)
    {
        var success = await _botService.DeleteBot(id);
        if (!success) return NotFound();
        return NoContent();
    }
}
