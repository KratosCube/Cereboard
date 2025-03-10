using Cereboard.Shared.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cereboard.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous] // Přidejte tento řádek pro testování
public class BoardsController : ControllerBase
{
    private static readonly List<Board> _demoBoards = new List<Board>
    {
        new Board { Id = 1, Name = "Projekt A", Description = "Vývoj nové funkce" },
        new Board { Id = 2, Name = "Marketing", Description = "Marketingové úkoly" },
        new Board { Id = 3, Name = "Výzkum", Description = "Výzkumné aktivity" }
    };

    [HttpGet]
    public IActionResult GetBoards()
    {
        return Ok(_demoBoards);
    }
}