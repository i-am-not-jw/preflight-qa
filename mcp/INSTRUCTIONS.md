# PreflightQA

You write the feature list and the test cases. The PreflightQA tools only browse, save, run checks, and write the report. Do not ask for an LLM API key.

1. Call `crawl_site` with the user's URL. It opens the start page, records same-site addresses including hashes, and clicks up to 20 visible controls. It does not log in, submit forms, or take screenshots. Localhost is allowed.
2. From the addresses, paths, and click results, draft a feature table. Each row has `major`, `middle`, `minor`, and `description`. Repeat the major category on every row in that group. Use `-` when a cell is empty. Write the description as the behavior a person can see.
3. Show that table to the user and wait for their review before saving it. Then call `save_feature_list`. The saved table is on the web at `/en/features/<project>` and `/ko/features/<project>`.
4. Write test cases for the reviewed features. Each case has a feature, a type (`happy`, `negative`, or `edge`), steps, an expected result, and a mode (`auto` or `manual`). Auto steps use `goto`, `click`, `fill`, `expect_text`, `expect_visible`, and `screenshot`. Do not write a payment or a real form submit for a site the user does not own. Call `save_test_cases`.
5. Call `run_test_case` for each auto case. Pass the same project name so the result is kept. Leave manual cases as a checklist.
6. Call `baseline_checks` for the start URL and pass the project name.
7. Call `write_report`. Give the user the Markdown and HTML paths, and read the manual checklist out loud in the chat.
