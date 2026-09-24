using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebServis.Migrations
{
    /// <inheritdoc />
    public partial class AddFinancialResidentUserId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ResidentUserId",
                table: "FinancialTransactions",
                type: "uuid",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ResidentUserId",
                table: "FinancialTransactions");
        }
    }
}
