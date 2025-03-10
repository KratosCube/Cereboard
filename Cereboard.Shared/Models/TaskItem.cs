namespace Cereboard.Shared.Models
{
    public class TaskItem
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int ColumnId { get; set; }
        public int Order { get; set; }
        public DateTime? DueDate { get; set; }
    }
}
