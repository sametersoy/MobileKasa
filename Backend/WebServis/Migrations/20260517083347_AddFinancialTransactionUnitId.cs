using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebServis.Migrations
{
    /// <inheritdoc />
    public partial class AddFinancialTransactionUnitId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "UnitId",
                table: "FinancialTransactions",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_FinancialTransactions_UnitId",
                table: "FinancialTransactions",
                column: "UnitId");

            migrationBuilder.AddForeignKey(
                name: "FK_FinancialTransactions_Units_UnitId",
                table: "FinancialTransactions",
                column: "UnitId",
                principalTable: "Units",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FinancialTransactions_Units_UnitId",
                table: "FinancialTransactions");

            migrationBuilder.DropIndex(
                name: "IX_FinancialTransactions_UnitId",
                table: "FinancialTransactions");

            migrationBuilder.DropColumn(
                name: "UnitId",
                table: "FinancialTransactions");
        }
    }
}
