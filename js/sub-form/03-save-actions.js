// 订阅保存动作：负责读取表单值、校验、持久化以及编辑删除入口。

function saveSub(id) {
  const payload = getSubFormPayload();

  if (!payload.name || !payload.expireDate) {
    handleInvalidSubPayload(payload);
    return;
  }

  subscriptions = readSubscriptionsFromStorage();
  const entry = buildSubEntry(payload);

  if (!id) {
    entry.id = Date.now();
    subscriptions.push(entry);
  } else {
    upsertSubEntry(id, entry);
  }

  writeSubscriptionsToStorage(subscriptions);
  _subClearDraft();
  clM();
  resetSubModalLayout();
  rSubscriptions();
  toast("✅ 已保存");
}

function editSub(id) {
  openSubModal(id);
}

function delSub(id) {
  if (!confirm("确定删除此订阅？")) {
    return;
  }

  subscriptions = readSubscriptionsFromStorage().filter(function(item) {
    return item.id !== id;
  });
  writeSubscriptionsToStorage(subscriptions);
  rSubscriptions();
  toast("🗑️ 已删除");
}

function getSubFormPayload() {
  const name = getTrimmedValue("subNameIn");
  const dateValue = getInputValue("subDateIn");
  const expireDate = dateValue.substring(0, 10);
  const cost = parseFloat(getInputValue("subCostIn")) || 0;
  const note = getTrimmedValue("subNoteIn");
  const customDaysInput = document.getElementById("subCustomDaysIn");
  const customDays = customDaysInput ? parseInt(customDaysInput.value, 10) || 30 : 30;

  return {
    name: name,
    expireDate: expireDate,
    cost: cost,
    note: note,
    customDays: customDays,
    renewal: window._subRenewalVal || "manual"
  };
}

function handleInvalidSubPayload(payload) {
  if (payload.name) {
    return;
  }

  const nameError = document.getElementById("subNameErr");
  const nameInput = document.getElementById("subNameIn");

  if (nameError) {
    nameError.style.display = "block";
    nameError.style.animation = "none";
    setTimeout(function() {
      nameError.style.animation = "subNameShake .4s ease";
    }, 10);
  }

  if (nameInput) {
    nameInput.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
    nameInput.focus();
  }
}

function buildSubEntry(payload) {
  return {
    name: payload.name,
    expireDate: payload.expireDate,
    expireTime: window._subTimeVal || "",
    cost: payload.cost,
    cycle: _subCycle,
    note: payload.note,
    renewal: payload.renewal,
    customDays: _subCycle === "custom" ? payload.customDays : undefined
  };
}

function upsertSubEntry(id, entry) {
  const index = subscriptions.findIndex(function(item) {
    return item.id === id;
  });

  if (index >= 0) {
    subscriptions[index] = Object.assign({}, subscriptions[index], entry);
    return;
  }

  entry.id = id;
  subscriptions.push(entry);
}

function resetSubModalLayout() {
  const modalBody = document.getElementById("mBody");

  if (!modalBody) {
    return;
  }

  modalBody.style.maxWidth = "";
  modalBody.style.width = "";
  modalBody.style.borderRadius = "";
  modalBody.style.padding = "";
  modalBody.style.textAlign = "";
  modalBody.style.boxSizing = "";
}

function readSubscriptionsFromStorage() {
  return JSON.parse(localStorage.getItem("tuole_subs") || "[]");
}

function writeSubscriptionsToStorage(list) {
  localStorage.setItem("tuole_subs", JSON.stringify(list));

  if (typeof save === "function") {
    save();
  }
}

function getInputValue(id) {
  const element = document.getElementById(id);
  return element ? element.value || "" : "";
}

function getTrimmedValue(id) {
  return getInputValue(id).trim();
}
