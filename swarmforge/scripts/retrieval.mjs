import {options} from './retrieval/options.mjs';
import {query} from './retrieval/query.mjs';
import {page, render} from './retrieval/page.mjs';

try {
  const request = options(process.argv.slice(2));
  process.stdout.write(render(page(await query(request), request), request.json));
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
