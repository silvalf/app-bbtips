using Microsoft.AspNetCore.Mvc;
using BBTips.Domain.Entities;
using BBTips.Domain.Interfaces;

namespace BBTips.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CredenciaisBotsController : ControllerBase
{
    private readonly ICredenciaisBotsService _service;

    public CredenciaisBotsController(ICredenciaisBotsService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var credenciais = await _service.GetAllAsync();
        return Ok(credenciais);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var credencial = await _service.GetByIdAsync(id);
        if (credencial == null)
            return NotFound();
        return Ok(credencial);
    }

    [HttpGet("principal")]
    public async Task<IActionResult> GetPrincipal()
    {
        var credencial = await _service.GetPrincipalAsync();
        if (credencial == null)
            return NotFound(new { message = "Nenhum bot principal encontrado" });
        return Ok(credencial);
    }

    [HttpGet("first")]
    public async Task<IActionResult> GetFirst()
    {
        var credencial = await _service.GetFirstAsync();
        if (credencial == null)
            return NotFound(new { message = "Nenhuma credencial encontrada" });
        return Ok(credencial);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CredenciaisBots credencial)
    {
        var created = await _service.CreateAsync(credencial);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CredenciaisBots credencial)
    {
        credencial.Id = id;
        var updated = await _service.UpdateAsync(credencial);
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await _service.DeleteAsync(id);
        if (!deleted)
            return NotFound();
        return NoContent();
    }
}
