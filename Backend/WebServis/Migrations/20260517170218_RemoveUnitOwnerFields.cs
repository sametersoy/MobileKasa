using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebServis.Migrations
{
    /// <inheritdoc />
    public partial class RemoveUnitOwnerFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OwnerEmail",
                table: "Units");

            migrationBuilder.DropColumn(
                name: "OwnerName",
                table: "Units");

            migrationBuilder.DropColumn(
                name: "OwnerPhone",
                table: "Units");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OwnerEmail",
                table: "Units",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "OwnerName",
                table: "Units",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "OwnerPhone",
                table: "Units",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
