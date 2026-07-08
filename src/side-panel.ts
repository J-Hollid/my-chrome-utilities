import { listCommands, runCommandById, type CommandRunRecord } from "./commands";

const PROJECT_NAME = "my-chrome-utilities";

const app = document.querySelector<HTMLElement>("#app");
const commandList = document.querySelector<HTMLElement>("#commands");
const commandLog = document.querySelector<HTMLElement>("#command-log");

if (app) {
  app.textContent = PROJECT_NAME;
}

function recordCommandRun(entry: CommandRunRecord): void {
  if (commandLog) {
    commandLog.textContent = entry.message;
  }
}

if (commandList) {
  for (const command of listCommands()) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = command.title;
    button.addEventListener("click", () => {
      runCommandById(command.id, { record: recordCommandRun });
    });
    commandList.append(button);
  }
}
