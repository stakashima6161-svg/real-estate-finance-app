const ids = [
  "rentIncome", "parkingIncome", "otherIncome",
  "managementCost", "repairCost", "propertyTax", "insuranceCost", "otherExpense",
  "interestExpense", "depreciation", "incomeTax",
  "currentLoan", "principalRepayment", "unpaidRepayment", "repairReserve",
  "cashCurrent", "cashPrevious", "netProfitOverride"
];

const sample = {
  rentIncome: 80000000,
  parkingIncome: 5000000,
  otherIncome: 1000000,
  managementCost: 8000000,
  repairCost: 6000000,
  propertyTax: 7000000,
  insuranceCost: 2000000,
  otherExpense: 4000000,
  interestExpense: 6000000,
  depreciation: 12000000,
  incomeTax: 5000000,
  currentLoan: 350000000,
  principalRepayment: 18000000,
  unpaidRepayment: 0,
  repairReserve: 10000000,
  cashCurrent: 30000000,
  cashPrevious: 28000000,
  netProfitOverride: ""
};

function yen(value) {
  const n = Number.isFinite(value) ? Math.round(value) : 0;
  const sign = n < 0 ? "▲" : "";
  return `${sign}${Math.abs(n).toLocaleString("ja-JP")}円`;
}

function percent(value) {
  if (!Number.isFinite(value)) return "-";
  return `${(value * 100).toFixed(1)}%`;
}

function years(value) {
  if (!Number.isFinite(value)) return "-";
  return `${value.toFixed(1)}年`;
}

function val(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  const raw = el.value;
  if (raw === "" || raw === null) return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setStatus(id, label, kind) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = label;
  el.className = `status ${kind || ""}`.trim();
}

function calc() {
  const revenue = val("rentIncome") + val("parkingIncome") + val("otherIncome");
  const operatingCosts =
    val("managementCost") + val("repairCost") + val("propertyTax") +
    val("insuranceCost") + val("otherExpense");

  const depreciation = val("depreciation");
  const interest = val("interestExpense");
  const tax = val("incomeTax");

  const operatingProfit = revenue - operatingCosts - depreciation;
  const profitBeforeTax = operatingProfit - interest;
  const autoNetProfit = profitBeforeTax - tax;
  const override = document.getElementById("netProfitOverride").value;
  const netProfit = override === "" ? autoNetProfit : val("netProfitOverride");

  const principal = val("principalRepayment");
  const unpaid = val("unpaidRepayment");
  const reserve = val("repairReserve");
  const currentLoan = val("currentLoan");

  const cashflow = netProfit + depreciation - principal - unpaid;
  const afterReserve = cashflow - reserve;
  const repaymentSourceCF = netProfit + depreciation;

  const cashChange = val("cashCurrent") - val("cashPrevious");

  const revenueDebtLimit = revenue * 5;
  const profitDebtLimit = operatingProfit > 0 ? operatingProfit / 0.10 : 0;
  const cfDebtLimit = repaymentSourceCF > 0 ? repaymentSourceCF * 15 : 0;

  const debtLimits = [revenueDebtLimit, profitDebtLimit, cfDebtLimit].filter(v => v > 0);
  const debtUpper = debtLimits.length ? Math.min(...debtLimits) : 0;
  const defensive = debtUpper * 0.70;
  const standard = debtUpper * 0.85;
  const aggressive = debtUpper;

  return {
    revenue,
    operatingCosts,
    operatingProfit,
    profitBeforeTax,
    netProfit,
    depreciation,
    principal,
    unpaid,
    reserve,
    cashflow,
    afterReserve,
    cashChange,
    currentLoan,
    repaymentSourceCF,
    revenueDebtLimit,
    profitDebtLimit,
    cfDebtLimit,
    debtUpper,
    defensive,
    standard,
    aggressive
  };
}

function cashflowComment(data) {
  if (data.revenue === 0 && data.currentLoan === 0) {
    return { label: "入力してください", kind: "", text: "決算書の数字を入力すると、ここにコメントが表示されます。" };
  }

  if (data.netProfit >= 0 && data.cashflow >= 0 && data.afterReserve >= 0) {
    return {
      label: "安定しています",
      kind: "ok",
      text: "利益、概算キャッシュフロー、修繕積立後の手残りがいずれもプラスです。現時点では利益と資金の両面で安定しています。今後は物件別に分けて、どの物件が資金を生んでいるか確認しましょう。"
    };
  }

  if (data.netProfit >= 0 && data.cashflow < 0) {
    return {
      label: "黒字でも資金注意",
      kind: "danger",
      text: "決算書上は黒字でも、借入元金返済などを考えると概算キャッシュフローがマイナスです。預金が増えにくい状態なので、返済条件、金利、修繕計画を確認する必要があります。"
    };
  }

  if (data.cashflow >= 0 && data.afterReserve < 0) {
    return {
      label: "修繕への備えに注意",
      kind: "warn",
      text: "概算キャッシュフローはプラスですが、将来修繕への備えを差し引くと手残りが不足します。利益の全額を自由に使えるお金と考えず、修繕資金を別に管理する必要があります。"
    };
  }

  if (data.netProfit < 0 && data.cashflow >= 0) {
    return {
      label: "利益と資金にズレ",
      kind: "warn",
      text: "決算書上は赤字ですが、減価償却費の影響により資金は残っている可能性があります。赤字の原因が一時的なものか、構造的な収益不足かを確認しましょう。"
    };
  }

  return {
    label: "守り優先",
    kind: "danger",
    text: "利益または手残りに不安があります。新規投資よりも、返済負担、家賃収入、修繕費、固定資産税、保険料などの見直しを優先する状態です。"
  };
}

function debtComment(data) {
  if (data.currentLoan === 0 || data.revenue === 0) {
    return { label: "入力してください", kind: "", text: "決算書と借入の数字を入力すると、ここにコメントが表示されます。" };
  }

  const loan = data.currentLoan;
  const upper = data.debtUpper;
  if (upper <= 0) {
    return {
      label: "判定できません",
      kind: "warn",
      text: "営業利益または返済原資CFが不足しているため、借入上限を計算できません。追加借入よりも、まず収益改善と資金繰りの確認を優先してください。"
    };
  }

  if (loan <= data.defensive) {
    return {
      label: "余裕あり",
      kind: "ok",
      text: "現在の借入は守りの目安以内です。安全性は高く、収益性を確認しながら攻めの投資を検討できる状態です。"
    };
  }

  if (loan <= data.standard) {
    return {
      label: "標準",
      kind: "ok",
      text: "現在の借入は標準の目安内です。攻めと守りのバランスは取れています。新規投資をする場合は、投資後も攻めの上限を超えないか確認しましょう。"
    };
  }

  if (loan <= data.aggressive) {
    return {
      label: "注意",
      kind: "warn",
      text: "現在の借入は攻めの上限に近い水準です。追加借入は慎重に検討し、空室増加、金利上昇、大規模修繕に耐えられるか確認しましょう。"
    };
  }

  return {
    label: "守り優先",
    kind: "danger",
    text: "現在の借入は攻めの上限を超えています。新規投資よりも、返済、収益改善、借換え、売却・組替えなどを優先して検討する状態です。"
  };
}

function updatePropertyResults() {
  const table = document.getElementById("propertyTable");
  const container = document.getElementById("propertyResults");
  if (!table || !container) return;

  const fields = ["income", "expense", "interest", "depreciation", "principal", "reserve"];
  const data = Array.from({ length: 5 }, () => Object.fromEntries(fields.map(f => [f, 0])));

  fields.forEach(field => {
    const row = table.querySelector(`tr[data-field="${field}"]`);
    if (!row) return;
    row.querySelectorAll("td input").forEach((input, index) => {
      data[index][field] = Number(input.value || 0);
    });
  });

  container.innerHTML = data.map((p, i) => {
    const profit = p.income - p.expense - p.interest - p.depreciation;
    const cf = profit + p.depreciation - p.principal;
    const after = cf - p.reserve;
    const hasInput = Object.values(p).some(v => v !== 0);
    const label = `物件${String.fromCharCode(65 + i)}`;
    const status = !hasInput ? "未入力" : after >= 0 ? "手残りあり" : "要確認";
    return `
      <div class="property-card">
        <h4>${label}</h4>
        <span>${status}</span>
        <strong>${yen(after)}</strong>
        <small>利益 ${yen(profit)}<br>概算CF ${yen(cf)}</small>
      </div>
    `;
  }).join("");
}

function update() {
  const data = calc();

  setText("kpiRevenue", yen(data.revenue));
  setText("kpiProfit", yen(data.netProfit));
  setText("kpiCF", yen(data.cashflow));
  setText("kpiAfterReserve", yen(data.afterReserve));

  setText("cfProfit", yen(data.netProfit));
  setText("cfDep", yen(data.depreciation));
  setText("cfPrincipal", yen(data.principal));
  setText("cfUnpaid", yen(data.unpaid));
  setText("cfTotal", yen(data.cashflow));
  setText("cfReserve", yen(data.reserve));
  setText("cfAfterReserve", yen(data.afterReserve));

  const cf = cashflowComment(data);
  setStatus("cashflowStatus", cf.label, cf.kind);
  setText("cashflowComment", cf.text);

  const revenueRatio = data.revenue > 0 ? data.currentLoan / data.revenue : NaN;
  const profitRatio = data.currentLoan > 0 ? data.operatingProfit / data.currentLoan : NaN;
  const cfYears = data.repaymentSourceCF > 0 ? data.currentLoan / data.repaymentSourceCF : NaN;

  setText("debtRevenueRatio", Number.isFinite(revenueRatio) ? `${revenueRatio.toFixed(1)}倍` : "-");
  setText("debtRevenueResult", Number.isFinite(revenueRatio) ? (revenueRatio <= 5 ? "目安内です" : "5倍を超えています") : "入力してください");

  setText("debtProfitRatio", percent(profitRatio));
  setText("debtProfitResult", Number.isFinite(profitRatio) ? (profitRatio >= 0.10 ? "目安内です" : "10%を下回っています") : "入力してください");

  setText("debtYears", years(cfYears));
  setText("debtYearsResult", Number.isFinite(cfYears) ? (cfYears <= 15 ? "目安内です" : "15年を超えています") : "入力してください");

  setText("defensiveTarget", yen(data.defensive));
  setText("standardTarget", yen(data.standard));
  setText("aggressiveTarget", yen(data.aggressive));
  setText("defensiveGap", yen(data.defensive - data.currentLoan));
  setText("standardGap", yen(data.standard - data.currentLoan));
  setText("aggressiveGap", yen(data.aggressive - data.currentLoan));

  const debt = debtComment(data);
  setStatus("debtStatus", debt.label, debt.kind);
  setText("debtComment", debt.text);

  setText("reportRevenue", yen(data.revenue));
  setText("reportProfit", yen(data.netProfit));
  setText("reportCF", yen(data.cashflow));
  setText("reportAfterReserve", yen(data.afterReserve));
  setText("reportCashflowText", cf.text);
  setText("reportDebtText", debt.text);

  updatePropertyResults();
}

function initTabs() {
  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(target).classList.add("active");
    });
  });
}

function loadSample() {
  Object.entries(sample).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  });

  const table = document.getElementById("propertyTable");
  const propertySample = {
    income: [36000000, 26000000, 14000000, 6000000, 4000000],
    expense: [9000000, 8000000, 4000000, 2000000, 1000000],
    interest: [2500000, 2000000, 1000000, 500000, 0],
    depreciation: [5000000, 4000000, 2000000, 500000, 500000],
    principal: [8000000, 6000000, 3000000, 1000000, 0],
    reserve: [4000000, 3000000, 2000000, 800000, 500000]
  };

  Object.entries(propertySample).forEach(([field, values]) => {
    const row = table.querySelector(`tr[data-field="${field}"]`);
    row.querySelectorAll("td input").forEach((input, index) => {
      input.value = values[index] || "";
    });
  });

  update();
}

function resetAll() {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  document.querySelectorAll("#propertyTable input").forEach(input => input.value = "");
  update();
}

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", update);
  });
  document.querySelectorAll("#propertyTable input").forEach(input => input.addEventListener("input", update));
  document.getElementById("loadSampleBtn").addEventListener("click", loadSample);
  document.getElementById("resetBtn").addEventListener("click", resetAll);
  document.getElementById("printBtn").addEventListener("click", () => window.print());
  update();
});
