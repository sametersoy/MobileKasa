using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebServis.Migrations
{
    /// <inheritdoc />
    public partial class AddDuesIdToFinancialTransaction : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "DuesId",
                table: "FinancialTransactions",
                type: "uuid",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DuesId",
                table: "FinancialTransactions");
        }
    }
}
