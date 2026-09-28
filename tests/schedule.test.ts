import { describe, expect, it } from "vitest";
import {
  aktauTime,
  getOpenState,
  resolveZone,
  TZ_CANDIDATES,
  toMinutes,
  UTC_OFFSET_MINUTES,
} from "@/lib/schedule";
import { schedule } from "@/lib/site";

/** Даты с явным смещением +05:00 = местное время Актау. */
const monday = (time: string) => new Date(`2026-09-28T${time}+05:00`); // пн
const saturday = (time: string) => new Date(`2026-10-03T${time}+05:00`); // сб
const sunday = (time: string) => new Date(`2026-10-04T${time}+05:00`); // вс

describe("toMinutes", () => {
  it("переводит часы в минуты", () => {
    expect(toMinutes("00:00")).toBe(0);
    expect(toMinutes("09:00")).toBe(540);
    expect(toMinutes("19:00")).toBe(1140);
    expect(toMinutes("17:00")).toBe(1020);
  });

  it("возвращает NaN на мусорном вводе", () => {
    expect(Number.isNaN(toMinutes(""))).toBe(true);
    expect(Number.isNaN(toMinutes("abc"))).toBe(true);
  });
});

describe("resolveZone", () => {
  it("находит часовой пояс Актау среди кандидатов", () => {
    const zone = resolveZone();
    expect(zone).toBeDefined();
    expect(TZ_CANDIDATES).toContain(zone);
  });

  it("возвращает undefined, если ни одна зона не поддерживается", () => {
    expect(resolveZone(["Not/AZone", "Etc/Definitely-Not"])).toBeUndefined();
  });
});

describe("aktauTime", () => {
  it("определяет день недели и время в Актау", () => {
    expect(aktauTime(monday("10:30"))).toEqual({ weekday: 1, minutes: 630 });
    expect(aktauTime(sunday("12:00"))).toEqual({ weekday: 0, minutes: 720 });
  });

  it("даёт тот же результат при резервном смещении UTC+5", () => {
    expect(aktauTime(monday("10:30"), undefined)).toEqual({ weekday: 1, minutes: 630 });
    expect(aktauTime(sunday("12:00"), undefined)).toEqual({ weekday: 0, minutes: 720 });
  });

  it("резервное смещение равно UTC+5", () => {
    expect(UTC_OFFSET_MINUTES).toBe(300);
  });

  it("корректно работает на границе суток в UTC", () => {
    // 2026-09-28T19:30Z = 2026-09-29 00:30 в Актау → вторник
    expect(aktauTime(new Date("2026-09-28T19:30:00Z"))).toEqual({ weekday: 2, minutes: 30 });
  });
});

describe("getOpenState: будни (Пн–Сб 09:00–19:00)", () => {
  it("до открытия сообщает время открытия", () => {
    const state = getOpenState(monday("08:00"));
    expect(state.open).toBe(false);
    expect(state.text).toBe("Сейчас закрыто · сегодня с 09:00");
  });

  it("в момент открытия уже работает", () => {
    const state = getOpenState(monday("09:00"));
    expect(state.open).toBe(true);
    expect(state.text).toBe("Сейчас открыто · до 19:00");
  });

  it("за минуту до закрытия ещё работает", () => {
    expect(getOpenState(monday("18:59")).open).toBe(true);
  });

  it("ровно в момент закрытия уже закрыто и обещает завтра", () => {
    const state = getOpenState(monday("19:00"));
    expect(state.open).toBe(false);
    // Вторник открывается в 09:00
    expect(state.text).toBe("Сейчас закрыто · завтра с 09:00");
  });

  it("поздно вечером в субботу обещает воскресенье 10:00", () => {
    const state = getOpenState(saturday("20:00"));
    expect(state.open).toBe(false);
    expect(state.text).toBe("Сейчас закрыто · завтра с 10:00");
  });

  it("в субботу днём открыто до 19:00", () => {
    const state = getOpenState(saturday("15:00"));
    expect(state.open).toBe(true);
    expect(state.text).toBe("Сейчас открыто · до 19:00");
  });
});

describe("getOpenState: воскресенье (10:00–17:00)", () => {
  it("утром сообщает, что открытие в 10:00", () => {
    const state = getOpenState(sunday("09:00"));
    expect(state.open).toBe(false);
    expect(state.text).toBe("Сейчас закрыто · сегодня с 10:00");
  });

  it("днём открыто до 17:00", () => {
    const state = getOpenState(sunday("12:00"));
    expect(state.open).toBe(true);
    expect(state.text).toBe("Сейчас открыто · до 17:00");
  });

  it("после 17:00 закрыто и обещает понедельник 09:00", () => {
    const state = getOpenState(sunday("18:00"));
    expect(state.open).toBe(false);
    expect(state.text).toBe("Сейчас закрыто · завтра с 09:00");
  });
});

describe("getOpenState: устойчивость", () => {
  it("работает на резервном смещении, когда зоны нет", () => {
    const state = getOpenState(monday("10:00"), schedule, undefined);
    expect(state.open).toBe(true);
    expect(state.dayIndex).toBe(0);
  });

  it("возвращает индекс дня по расписанию", () => {
    expect(getOpenState(saturday("12:00")).dayIndex).toBe(5);
    expect(getOpenState(sunday("12:00")).dayIndex).toBe(6);
  });

  it("индекс дня всегда указывает на существующий день недели", () => {
    for (let hour = 0; hour < 24; hour += 1) {
      const state = getOpenState(monday(`${String(hour).padStart(2, "0")}:00`));
      expect(schedule[state.dayIndex]).toBeDefined();
      expect(["open", "closed"]).toContain(state.open ? "open" : "closed");
      expect(state.text.length).toBeGreaterThan(0);
    }
  });

  it("ни в один момент суток не бывает открыто вне графика", () => {
    for (let hour = 0; hour < 24; hour += 1) {
      const time = `${String(hour).padStart(2, "0")}:00`;
      const state = getOpenState(monday(time));
      const minutes = toMinutes(time);
      const shouldBeOpen = minutes >= toMinutes("09:00") && minutes < toMinutes("19:00");
      expect(state.open).toBe(shouldBeOpen);
    }
  });
});
