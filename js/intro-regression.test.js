const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.join(__dirname, "..");
const indexHtml = fs.readFileSync(path.join(repoRoot, "index.html"), "utf8");
const introCss = fs.readFileSync(
    path.join(repoRoot, "css", "intro.css"),
    "utf8",
);

describe("intro regression", () => {
    it("mantém o título TO DO LIST dentro da linha da assinatura", () => {
        assert.match(
            indexHtml,
            /<div\s+class="site-signature__line"\s*>\s*<strong\s+class="site-signature__title site-signature__todo-title"\s*>\s*TO DO LIST\s*<\/strong>\s*<\/div>/,
        );
    });

    it("mantém a animação do título vinculada a um keyframes existente", () => {
        const titleRule = introCss.match(
            /\.site-signature__todo-title\s*\{([^}]*)\}/,
        );

        assert.ok(titleRule, "a regra CSS do título deve existir");

        const animation = titleRule[1].match(
            /\banimation:\s*todo-title-size\s+5s\b/,
        );

        assert.ok(animation, "o título deve usar a animação todo-title-size");

        assert.match(
            introCss,
            /@keyframes\s+todo-title-size\s*\{/,
        );
    });
});
