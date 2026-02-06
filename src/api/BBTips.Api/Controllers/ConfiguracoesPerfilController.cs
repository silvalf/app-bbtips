using Microsoft.AspNetCore.Mvc;
using BBTips.Domain.Entities;
using BBTips.Domain.Interfaces;

namespace BBTips.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ConfiguracoesPerfilController : ControllerBase
{
    private readonly IConfiguracaoPerfilService _service;

    public ConfiguracoesPerfilController(IConfiguracaoPerfilService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var configuracoes = await _service.GetAllAsync();
        return Ok(configuracoes);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var configuracao = await _service.GetByIdAsync(id);
        if (configuracao == null)
            return NotFound();
        return Ok(configuracao);
    }

    [HttpGet("first")]
    public async Task<IActionResult> GetFirst()
    {
        var configuracao = await _service.GetFirstAsync();
        if (configuracao == null)
            return NotFound(new { message = "Nenhuma configuração encontrada" });
        return Ok(configuracao);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ConfiguracaoPerfil configuracao)
    {
        var created = await _service.CreateAsync(configuracao);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] ConfiguracaoPerfil configuracao)
    {
        configuracao.Id = id;
        var updated = await _service.UpdateAsync(configuracao);
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id);
        if (!deleted)
            return NotFound();
        return NoContent();
    }
}
