namespace Cereboard.Shared.Models
{
    public class Column
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int Order { get; set; }
        public int BoardId { get; set; }
        public string Color { get; set; } = "#f5f5f5"; // Default color
        public List<TaskItem> Tasks { get; set; } = new();
    }
}