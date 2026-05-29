using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Pgvector;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddGeminiEmbeddings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Vector>(
                name: "GeminiEmbedding",
                table: "Properties",
                type: "vector(768)",
                nullable: true);

            migrationBuilder.AlterColumn<Vector>(
                name: "Embedding",
                table: "DocumentChunks",
                type: "vector(1536)",
                nullable: true,
                oldClrType: typeof(Vector),
                oldType: "vector(1536)");

            migrationBuilder.AddColumn<Vector>(
                name: "GeminiEmbedding",
                table: "DocumentChunks",
                type: "vector(768)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ActiveLLMProvider",
                table: "Agents",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "byok_key_status",
                table: "Agents",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Valid");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "gemini_cache_expires_at",
                table: "Agents",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "gemini_cache_id",
                table: "Agents",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Properties_GeminiEmbedding",
                table: "Properties",
                column: "GeminiEmbedding")
                .Annotation("Npgsql:IndexMethod", "hnsw")
                .Annotation("Npgsql:IndexOperators", new[] { "vector_cosine_ops" });

            migrationBuilder.CreateIndex(
                name: "IX_Properties_VectorEmbedding",
                table: "Properties",
                column: "VectorEmbedding")
                .Annotation("Npgsql:IndexMethod", "hnsw")
                .Annotation("Npgsql:IndexOperators", new[] { "vector_cosine_ops" });

            migrationBuilder.CreateIndex(
                name: "IX_DocumentChunks_GeminiEmbedding",
                table: "DocumentChunks",
                column: "GeminiEmbedding")
                .Annotation("Npgsql:IndexMethod", "hnsw")
                .Annotation("Npgsql:IndexOperators", new[] { "vector_cosine_ops" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Properties_GeminiEmbedding",
                table: "Properties");

            migrationBuilder.DropIndex(
                name: "IX_Properties_VectorEmbedding",
                table: "Properties");

            migrationBuilder.DropIndex(
                name: "IX_DocumentChunks_GeminiEmbedding",
                table: "DocumentChunks");

            migrationBuilder.DropColumn(
                name: "GeminiEmbedding",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "GeminiEmbedding",
                table: "DocumentChunks");

            migrationBuilder.DropColumn(
                name: "ActiveLLMProvider",
                table: "Agents");

            migrationBuilder.DropColumn(
                name: "byok_key_status",
                table: "Agents");

            migrationBuilder.DropColumn(
                name: "gemini_cache_expires_at",
                table: "Agents");

            migrationBuilder.DropColumn(
                name: "gemini_cache_id",
                table: "Agents");

            migrationBuilder.AlterColumn<Vector>(
                name: "Embedding",
                table: "DocumentChunks",
                type: "vector(1536)",
                nullable: false,
                oldClrType: typeof(Vector),
                oldType: "vector(1536)",
                oldNullable: true);
        }
    }
}
