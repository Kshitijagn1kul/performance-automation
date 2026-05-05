import { group, sleep } from "k6";
import { config } from "../common/config.js";
import { request } from "../common/client.js";
import { testData } from "../data/test_data.js";

export function genericFlow() {
  group("generic auth and role APIs", () => {
    request({
      name: "get logged user",
      endpoint: "frappe.auth.get_logged_user",
    });
    request({
      name: "csrf token",
      endpoint: "core.api.csrf.token",
    });
    request({
      name: "get HROps roles",
      endpoint: "core.get_roles",
      params: { module: testData.module },
    });
  });
}

export function quickAccessFlow() {
  group("quick access food APIs", () => {
    request({
      name: "food preference",
      endpoint: "food.config.getapi.food_pr",
    });
    request({
      name: "booking details",
      endpoint: "food.config.getapi.booking_details",
      params: { date: testData.displayDate },
    });
    request({
      name: "food booking options",
      endpoint: "food.config.getapi.food_booking",
      params: { location: testData.location },
    });
  });
}

export function dashboardFlow() {
  group("dashboard APIs", () => {
    request({
      name: "food dashboard",
      endpoint: "food.config.dashboard.dashboard",
      params: {
        tab: "food",
        from_date: testData.fromDate,
        to_date: testData.toDate,
      },
    });
    request({
      name: "dashboard list",
      endpoint: "food.config.dashboard.db_list",
      params: {
        from_date: testData.fromDate,
        to_date: testData.toDate,
      },
    });
  });
}

export function foodLogFlow() {
  group("food log APIs", () => {
    request({
      name: "self food log",
      endpoint: "food.config.getapi.food_log",
      params: {
        filter_by: "self",
        from_date: testData.fromDate,
        to_date: testData.toDate,
        start: 0,
        limit: 10,
      },
    });
    request({
      name: "organisation food log",
      endpoint: "food.config.getapi.food_log",
      params: {
        filter_by: "organisation",
        from_date: testData.fromDate,
        to_date: testData.toDate,
        start: 0,
        limit: 10,
      },
    });
  });
}

export function foodMenuFlow() {
  group("food menu APIs", () => {
    request({
      name: "food menu",
      endpoint: "food.config.getapi.food_menu",
      params: {
        location: testData.location,
        date: testData.displayDate,
      },
    });
  });
}

export function stockFlow() {
  group("stock management APIs", () => {
    request({
      name: "stock inventory log",
      endpoint: "food.config.getapi.iv_log",
      params: {
        tab: "stock",
        from_date: testData.fromDate,
        to_date: testData.toDate,
        start: 0,
        limit: 20,
      },
    });
    request({
      name: "stock request log",
      endpoint: "food.config.getapi.iv_log",
      params: {
        tab: "request",
        from_date: testData.fromDate,
        to_date: testData.toDate,
        start: 0,
        limit: 20,
      },
    });
    request({
      name: "stocks list",
      endpoint: "food.config.getapi.stocks",
    });
    request({
      name: "stock request details",
      endpoint: "food.config.getapi.view_details",
      params: { docname: testData.stockRequestDoc },
    });
  });
}

export function vendorFlow() {
  group("vendor APIs", () => {
    request({
      name: "vendors",
      endpoint: "food.config.getapi.get_vendors",
      params: { filter_text: testData.vendor },
    });
  });
}

export function reportsFlow() {
  group("report APIs", () => {
    request({
      name: "reports list",
      endpoint: "food.config.getapi.get_reports",
      params: {
        from_date: testData.fromDate,
        to_date: testData.toDate,
      },
    });
    request({
      name: "report details",
      endpoint: "food.config.getapi.view_details",
      params: { docname: testData.reportDoc },
    });
  });
}

export function billsFlow() {
  group("bill APIs", () => {
    request({
      name: "bills list",
      endpoint: "food.config.getapi.list_bills",
      params: {
        from_date: testData.fromDate,
        to_date: testData.toDate,
        location: testData.location,
      },
    });
    request({
      name: "bill details",
      endpoint: "food.config.getapi.view_details",
      params: { docname: testData.billDoc },
    });
  });
}

export function writeFlow() {
  if (!config.includeWrites) {
    return;
  }

  group("write APIs", () => {
    request({
      name: "update preference",
      endpoint: "food.config.putapi.update_prefer",
      params: {
        location: testData.location,
        type: "Veg",
      },
    });
    request({
      name: "add report",
      method: "POST",
      endpoint: "food.config.putapi.add_report",
      body: {
        issues: "Load test issue",
        location: testData.location,
        description: "Created by k6 performance test.",
        priority: "Low",
        attach_images: [],
      },
    });
  });
}

export function hropsFoodScenario() {
  genericFlow();
  quickAccessFlow();
  dashboardFlow();
  foodLogFlow();
  foodMenuFlow();
  stockFlow();
  vendorFlow();
  reportsFlow();
  billsFlow();
  writeFlow();
  sleep(config.defaultSleepSeconds);
}
