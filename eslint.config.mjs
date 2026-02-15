import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["app/api/**/*.ts", "app/dashboard/**/*.tsx", "middleware.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/db", "@/lib/auth/get-current-user"],
              message:
                "Folosește helper-ele Supabase noi. Importurile legacy sunt interzise în runtime.",
            },
            {
              group: ["drizzle-orm", "drizzle-orm/*"],
              message: "drizzle-orm este interzis în runtime.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["app/api/**/*.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "FunctionDeclaration[id.name='getAuthUser']",
          message:
            "Nu defini getAuthUser local. Folosește getSupabaseAuthContext din lib/supabase/auth-context.",
        },
      ],
    },
  },
  {
    files: ["app/dashboard/**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "VariableDeclarator[id.name='getAuthHeaders']",
          message:
            "Nu defini getAuthHeaders local. Folosește helper-ul comun din lib/supabase/auth-headers.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
