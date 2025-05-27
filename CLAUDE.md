see @.llm-docs/PROJECT_TOOLING_STANDARDS.md for how to organize project on the higher-level of tooling
see @.llm-docs/PACKAGE_ORGANISATION_AND_CODE_SEPARATION_STANDARDS.md to understand how to organize and test generated code
see @.llm-docs/CODE_STYLE.md for code style specifics
see @.llm-docs/libs/effect-schema.md for effect-schema docs

after each logical step (e.g. task complete) you always have to check that it builds/lints/tests

make sure not to run cli tools in watch mode (unless you really want to do it in background and have good means of how to clean it up); if it's possible to explicitly set one-shot mode then do it