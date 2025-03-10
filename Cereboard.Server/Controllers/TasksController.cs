using Cereboard.Shared.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;

namespace Cereboard.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous] // Pro vývoj, v produkci použijte autorizaci
    public class TasksController : ControllerBase
    {
        // V produkčním prostředí by zde byl DbContext nebo repository
        private static readonly List<TaskItem> _demoTasks = new List<TaskItem>
        {
            new TaskItem { Id = 1, Title = "Implementovat drag-and-drop", Description = "Přidat funkci pro přesouvání úkolů mezi sloupci", ColumnId = 1, Order = 1 },
            new TaskItem { Id = 2, Title = "Vytvořit API endpointy", Description = "Implementovat REST API pro úkoly a sloupce", ColumnId = 2, Order = 1 },
            new TaskItem { Id = 3, Title = "Navrhnout UI", Description = "Vytvořit moderní uživatelské rozhraní", ColumnId = 3, Order = 1 }
        };

        // GET: api/tasks
        [HttpGet]
        public IActionResult GetAllTasks()
        {
            return Ok(_demoTasks);
        }

        // GET: api/tasks/5
        [HttpGet("{id}")]
        public IActionResult GetTask(int id)
        {
            var task = _demoTasks.FirstOrDefault(t => t.Id == id);
            if (task == null)
            {
                return NotFound();
            }

            return Ok(task);
        }

        // GET: api/tasks/column/5
        [HttpGet("column/{columnId}")]
        public IActionResult GetTasksByColumn(int columnId)
        {
            var tasks = _demoTasks.Where(t => t.ColumnId == columnId).ToList();
            return Ok(tasks);
        }

        // POST: api/tasks
        [HttpPost]
        public IActionResult CreateTask(TaskItem task)
        {
            if (task == null || string.IsNullOrEmpty(task.Title))
            {
                return BadRequest("Úkol musí mít název");
            }

            // Generování nového ID - v produkci by to řešila databáze
            task.Id = _demoTasks.Any() ? _demoTasks.Max(t => t.Id) + 1 : 1;

            // Nastavení pořadí v rámci sloupce
            var columntasks = _demoTasks.Where(t => t.ColumnId == task.ColumnId).ToList();
            task.Order = columntasks.Any() ? columntasks.Max(t => t.Order) + 1 : 1;

            _demoTasks.Add(task);

            return CreatedAtAction(nameof(GetTask), new { id = task.Id }, task);
        }

        // PUT: api/tasks/5
        [HttpPut("{id}")]
        public IActionResult UpdateTask(int id, TaskItem task)
        {
            if (id != task.Id)
            {
                return BadRequest("ID v URL neodpovídá ID úkolu");
            }

            var existingTask = _demoTasks.FirstOrDefault(t => t.Id == id);
            if (existingTask == null)
            {
                return NotFound();
            }

            // Aktualizace existujícího úkolu
            existingTask.Title = task.Title;
            existingTask.Description = task.Description;
            existingTask.DueDate = task.DueDate;
            existingTask.Order = task.Order;

            // Pokud se změnil sloupec, aktualizujeme ColumnId
            if (existingTask.ColumnId != task.ColumnId)
            {
                existingTask.ColumnId = task.ColumnId;
                // V reálné aplikaci bychom přepočítali pořadí úkolů
            }

            return NoContent();
        }

        // PATCH: api/tasks/5/move
        [HttpPatch("{id}/move")]
        public IActionResult MoveTask(int id, [FromBody] MoveTaskRequest request)
        {
            var task = _demoTasks.FirstOrDefault(t => t.Id == id);
            if (task == null)
            {
                return NotFound();
            }

            // Aktualizace sloupce
            task.ColumnId = request.ColumnId;
            task.Order = request.Order;

            return NoContent();
        }

        // DELETE: api/tasks/5
        [HttpDelete("{id}")]
        public IActionResult DeleteTask(int id)
        {
            var task = _demoTasks.FirstOrDefault(t => t.Id == id);
            if (task == null)
            {
                return NotFound();
            }

            _demoTasks.Remove(task);

            return NoContent();
        }
    }

    // Pomocná třída pro požadavek přesunu úkolu
    public class MoveTaskRequest
    {
        public int ColumnId { get; set; }
        public int Order { get; set; }
    }
}