import {Action} from "../constants/actions";
import { Markup } from "telegraf";

export class Buttons {
    LOGIN() {
        return [Markup.button(Action.LOGIN)]
    }

    SEND_ORDER_FOR_SELLERS() {
        return [Markup.button(Action.SEND_ORDER_FOR_SELLERS)]
    }

    VIEW_ORDERS() {
        return [Markup.button(Action.VIEW_ORDERS)]
    }

    SEND_ORDER() {
        return [Markup.button(Action.SEND_ORDER)]
    }

    CONTINUE() {
        return [Markup.button(Action.CONTINUE)]
    }

    BACK() {
        return [Markup.button(Action.BACK)]
    }

    MAKE_ORDER() {
        return [Markup.button(Action.MAKE_ORDER)]
    }

    MAIN_MENU() {
        return [Markup.button(Action.MAIN_MENU)]
    }

    FAQ() {
        return [Markup.button(Action.FAQ)]
    }

    BUTTON_MAIN_MENU() {
        return [Markup.button(Action.BUTTON_MAIN_MENU)]
    }

    SET_AUTH() {
        return Markup.keyboard([
            [Action.LOGIN],
            [Action.FAQ]
        ]
        ).resize()
        .extra()
    }

    SET_MAIN_MENU() {
        return Markup.keyboard(
            [
                [Action.SEND_ORDER_FOR_SELLERS],
                [Action.MAKE_ORDER, Action.VIEW_ORDERS],
                [Action.FAQ]
            ]
        ).resize()
        .extra()
    }

    SET_VERIFY_ORDER() {
        return Markup.keyboard(
            [
                [Action.CONTINUE, Action.SEND_ORDER],
                [Action.MAIN_MENU]
            ]
        ).resize()
        .extra()
    }

    BACK_BUTTON() {
        return Markup.keyboard([Markup.button(Action.BACK)])
        .resize()
        .extra()
    }
}