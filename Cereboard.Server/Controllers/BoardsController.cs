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

    [HttpGet("{id}")]
    public IActionResult GetBoard(int id)
    {
        var board = _demoBoards.FirstOrDefault(b => b.Id == id);
        if (board == null) return NotFound();

        // Přidáme demo sloupce a úkoly
        board.Columns = new List<Column>
    {
        new Column
        {
            Id = 1,
            Name = "K Udělání",
            Order = 1,
            BoardId = board.Id,
            Tasks = new List<TaskItem>
            {
                new TaskItem { Id = 1, Title = "Vytvořit návrh UI", Description = "Navrhnout UI pro kanban board", ColumnId = 1, Order = 1 },
                new TaskItem { Id = 2, Title = "Implementovat drag and drop", Description = "Přidat funkci drag and drop pro úkoly", ColumnId = 1, Order = 2 }
            }
        },
        new Column
        {
            Id = 2,
            Name = "V Progresu",
            Order = 2,
            BoardId = board.Id,
            Tasks = new List<TaskItem>
            {
                new TaskItem { Id = 3, Title = "Přidat API pro úkoly", Description = "Implementovat API endpointy pro úkoly", ColumnId = 2, Order = 1 }
            }
        },
        new Column
        {
            Id = 3,
            Name = "Hotovo",
            Order = 3,
            BoardId = board.Id,
            Tasks = new List<TaskItem>
            {
                new TaskItem { Id = 4, Title = "Základní struktura projektu", Description = "Vytvořit základní strukturu projektu", ColumnId = 3, Order = 1 }
            }
        }
    };

        return Ok(board);
    }
}