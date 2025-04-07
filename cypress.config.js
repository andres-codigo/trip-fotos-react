import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    env: {
      root_url: "/",
      user_email: process.env.CYPRESS_USER_EMAIL,
      user_password: process.env.CYPRESS_USER_PASSWORD,
      vite_database_url: process.env.VITE_BACKEND_BASE_URL,
    },
  },

  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
  },
});
