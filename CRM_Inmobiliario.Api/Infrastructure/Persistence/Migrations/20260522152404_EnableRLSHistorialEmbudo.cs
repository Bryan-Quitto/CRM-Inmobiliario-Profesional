using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class EnableRLSHistorialEmbudo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE ""ContactoHistorialEmbudos"" ENABLE ROW LEVEL SECURITY;

                CREATE POLICY ""Agents can view their own contact funnel history""
                ON ""ContactoHistorialEmbudos""
                FOR SELECT
                USING (
                    ""ContactoId"" IN (
                        SELECT ""Id"" FROM ""Contactos"" WHERE ""AgenteId"" = auth.uid()
                    )
                );

                CREATE POLICY ""Agents can insert their own contact funnel history""
                ON ""ContactoHistorialEmbudos""
                FOR INSERT
                WITH CHECK (
                    ""ContactoId"" IN (
                        SELECT ""Id"" FROM ""Contactos"" WHERE ""AgenteId"" = auth.uid()
                    )
                );

                CREATE POLICY ""Agents can update their own contact funnel history""
                ON ""ContactoHistorialEmbudos""
                FOR UPDATE
                USING (
                    ""ContactoId"" IN (
                        SELECT ""Id"" FROM ""Contactos"" WHERE ""AgenteId"" = auth.uid()
                    )
                );

                CREATE POLICY ""Agents can delete their own contact funnel history""
                ON ""ContactoHistorialEmbudos""
                FOR DELETE
                USING (
                    ""ContactoId"" IN (
                        SELECT ""Id"" FROM ""Contactos"" WHERE ""AgenteId"" = auth.uid()
                    )
                );
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DROP POLICY IF EXISTS ""Agents can view their own contact funnel history"" ON ""ContactoHistorialEmbudos"";
                DROP POLICY IF EXISTS ""Agents can insert their own contact funnel history"" ON ""ContactoHistorialEmbudos"";
                DROP POLICY IF EXISTS ""Agents can update their own contact funnel history"" ON ""ContactoHistorialEmbudos"";
                DROP POLICY IF EXISTS ""Agents can delete their own contact funnel history"" ON ""ContactoHistorialEmbudos"";
                ALTER TABLE ""ContactoHistorialEmbudos"" DISABLE ROW LEVEL SECURITY;
            ");
        }
    }
}
