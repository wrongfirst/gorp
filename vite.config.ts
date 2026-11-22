import { defineConfig } from "vite";
import type { Plugin } from "vite";
import { readFileSync, copyFileSync, existsSync } from "node:fs";
import { parse } from "toml";
import { parse as parseYaml } from "yaml";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import tailwindcss from "@tailwindcss/vite";

const require = createRequire(import.meta.url);
const pyodideVersion: string = require("pyodide/package.json").version;

const buildDate = new Date().toLocaleDateString(undefined, {
  year: "numeric",
  month: "long",
  day: "2-digit",
});

function rawTextPlugin(): Plugin {
  const cache = new Map<string, string>();

  return {
    name: "vite-raw-text",
    enforce: "pre",
    async resolveId(source, importer) {
      if (source.endsWith(".md") && !source.includes('?') && importer) {
        const resolved = await this.resolve(source, importer);
        if (resolved) {
          const virtualId = resolved.id + "\0__raw__";
          cache.set(virtualId, resolved.id);
          return { id: virtualId, moduleSideEffects: true };
        }
      }
    },
    load(id) {
      if (id.endsWith("__raw__")) {
        const realPath = cache.get(id) || id.replace(/\0__raw__$/, "");
        try {
          const content = readFileSync(realPath, "utf-8");
          return `export default ${JSON.stringify(content)};`;
        } catch (e) {
          console.error(`[raw-text] Failed to load ${realPath}:`, e);
          return `export default "";`;
        }
      }
      return null;
    },
  };
}

function yamlPlugin(): Plugin {
  const cache = new Map<string, string>();

  return {
    name: "vite-yaml-plugin",
    enforce: "pre" as const,
    async resolveId(source: string, importer: string | undefined) {
      if ((!source.endsWith(".yaml") && !source.endsWith(".yml")) || !importer) return;
      const resolved = await this.resolve(source, importer);
      if (resolved) {
        const virtualId = resolved.id + "\0__yaml__";
        cache.set(virtualId, resolved.id);
        return { id: virtualId, moduleSideEffects: true };
      }
    },
    load(id: string) {
      if (id.endsWith("__yaml__")) {
        const realPath = cache.get(id) || id.replace(/\0__yaml__$/, "");
        try {
          const content = readFileSync(realPath, "utf-8");
          const data = parseYaml(content);
          return `export default ${JSON.stringify(data)};`;
        } catch (e) {
          console.error(`[yaml-plugin] Failed to load ${realPath}:`, e);
          return `export default {};`;
        }
      }
      return null;
    },
  };
}

const DEFAULT_SITE_CONFIG = {
  title: "codebook",
  subtitle: "by wrongfirst",
  home_page: "https://wrongfirst.dev",
  logo_emoji: "📓",
};

function getSiteConfig(): Record<string, any> {
  let tomlPath = resolve(import.meta.dirname, "site.toml");
  if (!existsSync(tomlPath)) {
    tomlPath = resolve(import.meta.dirname, "site.toml.example");
  }
  try {
    const content = readFileSync(tomlPath, "utf-8");
    return { ...DEFAULT_SITE_CONFIG, ...parse(content) };
  } catch (e) {
    console.error("[getSiteConfig] Failed to load site.toml:", e);
    return { ...DEFAULT_SITE_CONFIG };
  }
}

function tomlPlugin(): Plugin {
  const cache = new Map<string, string>();

  return {
    name: "vite-toml-plugin",
    enforce: "pre" as const,
    async resolveId(source: string, importer: string | undefined) {
      if (!source.endsWith(".toml") || !importer) return;
      const resolved = await this.resolve(source, importer);
      if (resolved && existsSync(resolved.id)) {
        const virtualId = resolved.id + "\0__toml__";
        cache.set(virtualId, resolved.id);
        return { id: virtualId, moduleSideEffects: true };
      } else if (source.endsWith("site.toml")) {
        const fallbackPath = resolve(import.meta.dirname, "site.toml.example");
        const virtualId = fallbackPath + "\0__toml__";
        cache.set(virtualId, fallbackPath);
        return { id: virtualId, moduleSideEffects: true };
      }
    },
    load(id: string) {
      if (id.endsWith("__toml__")) {
        const realPath = cache.get(id) || id.replace(/\0__toml__$/, "");
        if (realPath.endsWith("site.toml") || realPath.endsWith("site.toml.example")) {
          const data = getSiteConfig();
          return `export default ${JSON.stringify(data)};`;
        }
        try {
          const content = readFileSync(realPath, "utf-8");
          const data = parse(content);
          return `export default ${JSON.stringify(data)};`;
        } catch (e) {
          console.error(`[toml-plugin] Failed to load ${realPath}:`, e);
          return `export default {};`;
        }
      }
      return null;
    },
  };
}

function escapeHtmlAttr(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function derivePortalName(siteConfig: Record<string, any>): string {
  const explicit = typeof siteConfig.portal_name === "string" ? siteConfig.portal_name.trim() : "";
  if (explicit) return explicit;

  const subtitle = typeof siteConfig.subtitle === "string" ? siteConfig.subtitle.trim() : "";
  const fromSubtitle = subtitle.replace(/^by\s+/i, "").trim();
  if (fromSubtitle) return fromSubtitle;

  const homePage = typeof siteConfig.home_page === "string" ? siteConfig.home_page.trim() : "";
  if (homePage) {
    try {
      const parsed = new URL(homePage);
      if (parsed.hostname) return parsed.hostname.replace(/^www\./, "");
    } catch {
      // Relative home_page (e.g. "/") resolves hostname at runtime in branding.ts
    }
  }
  return "";
}

function htmlMetaPlugin(): Plugin {
  return {
    name: "vite-html-meta",
    transformIndexHtml(html) {
      try {
        const siteConfig = getSiteConfig();
        const { title, subtitle, headline, description, keywords, languages, og_image, logo_emoji, home_page, project_url } = siteConfig;
        const portalName = derivePortalName(siteConfig);
        const trimmedHomePage = typeof home_page === "string" ? home_page.trim() : "";
        const projectUrl = (
          typeof project_url === "string" && project_url.trim()
            ? project_url.trim()
            : "https://github.com"
        ).replace(/\/+$/, "");

        const pageTitle = headline || (subtitle ? `${title} | ${subtitle}` : title);
        const pageDescription = description || `Interactive programming exercises in the browser`;
        const pageKeywords =
          keywords ||
          Array.from(
            new Set(
              [
                title,
                subtitle,
                "programming exercises",
                "interactive exercises",
                "in-browser programming",
                "web-based compiler",
                ...(Array.isArray(languages) ? languages : []),
              ].filter(Boolean)
            )
          ).join(", ");

        let res = html;
        res = res.replace(/(<span id="header-title"[^>]*>).*?(<\/span>)/s, `$1${escapeHtmlAttr(title || "")}$2`);
        if (logo_emoji) {
          res = res.replace(/(<span id="header-logo"[^>]*>).*?(<\/span>)/s, `$1${escapeHtmlAttr(logo_emoji)}$2`);
        } else {
          res = res.replace(
            /(<span id="header-logo"[^>]*class="[^"]*)\bflex\b([^"]*")/s,
            `$1hidden$2`
          );
        }
        if (trimmedHomePage && portalName) {
          res = res.replace(/(<a id="header-portal-link"[^>]*href=")[^"]*(")/s, `$1${escapeHtmlAttr(trimmedHomePage)}$2`);
          res = res.replace(/(<span id="header-portal-name"[^>]*>).*?(<\/span>)/s, `$1${escapeHtmlAttr(portalName)}$2`);
        } else {
          res = res.replace(
            /(<a id="header-portal-link"[^>]*class="[^"]*)\binline-flex\b([^"]*")/s,
            `$1hidden$2`
          );
          res = res.replace(/(<a id="header-portal-link"[^>]*)\s+href="[^"]*"/s, `$1`);
          res = res.replace(/(<span id="header-breadcrumb-sep"[^>]*class=")/s, `$1hidden `);
        }
        res = res.replace(
          /(<a id="footer-repo-link"[^>]*href=")[^"]*(")/s,
          (_, p1, p2) => `${p1}${escapeHtmlAttr(projectUrl)}${p2}`
        );
        res = res.replace(
          /(<a id="footer-issues-link"[^>]*href=")[^"]*(")/s,
          (_, p1, p2) => `${p1}${escapeHtmlAttr(`${projectUrl}/issues`)}${p2}`
        );
        res = res.replace(
          /(<span id="build-date"[^>]*>).*?(<\/span>)/s,
          (_, p1, p2) => `${p1}Last updated on ${escapeHtmlAttr(buildDate)}${p2}`
        );
        res = res.replace(/<title>.*<\/title>/, `<title>${escapeHtmlAttr(pageTitle)}</title>`);
        res = res.replace("</head>", `  <meta property="og:title" content="${escapeHtmlAttr(pageTitle)}">\n</head>`);
        if (pageDescription) {
          res = res.replace("</head>", `  <meta name="description" content="${escapeHtmlAttr(pageDescription)}">\n</head>`);
          res = res.replace("</head>", `  <meta property="og:description" content="${escapeHtmlAttr(pageDescription)}">\n</head>`);
        }
        if (pageKeywords) {
          res = res.replace("</head>", `  <meta name="keywords" content="${escapeHtmlAttr(pageKeywords)}">\n</head>`);
        }
        if (og_image) {
          res = res.replace("</head>", `  <meta property="og:image" content="${escapeHtmlAttr(og_image)}">\n</head>`);
          res = res.replace("</head>", `  <meta name="twitter:card" content="summary_large_image">\n</head>`);
        }
        return res;
      } catch (e) {
        console.error("[html-meta] Failed to inject meta tags from site.toml:", e);
        return html;
      }
    },
  };
}

export default defineConfig({
  base: "./",
  root: ".",
  server: {
    host: true,
  },
  preview: {
    host: true,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,

    target: "esnext",
    minify: true,
  },
  define: {
    PYODIDE_VERSION: JSON.stringify(pyodideVersion),
  },
  plugins: [tailwindcss(), rawTextPlugin(), yamlPlugin(), tomlPlugin(), htmlMetaPlugin()],
});
