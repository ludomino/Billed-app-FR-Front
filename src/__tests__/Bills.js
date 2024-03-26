/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import Bills from "../containers/Bills.js"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store"
import router from "../app/Router.js"

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    document.body.innerHTML = BillsUI({ data: bills })
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    })
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    )
  })

  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId("icon-window"))
      const windowIcon = screen.getByTestId("icon-window")
       //to-do write expect expression
      expect(windowIcon.classList.contains("active-icon")).toBe(true)
    })

    test("Then bills should be ordered from earliest to latest", () => {
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML)

      const antiChrono = (a, b) => (a < b ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    describe("When I click on the icon eye", () => {
      test("Then a modal should open", async () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        const store = null
        const newBill = new Bills({
          document,
          onNavigate,
          store,
          localStorage: window.localStorage,
        })
        await waitFor(() => screen.getByTestId("modal-bill"))
        const modalBill = screen.getByTestId("modal-bill")
        expect(modalBill.classList.contains("show")).toBeFalsy()
        const eyeIcon = screen.getAllByTestId("icon-eye")[0]
        const handleClickIconEyeSpy = jest.spyOn(newBill, "handleClickIconEye")
        eyeIcon.addEventListener("click", () =>
          newBill.handleClickIconEye(eyeIcon)
        )
        fireEvent.click(eyeIcon)
        expect(handleClickIconEyeSpy).toHaveBeenCalled()
        expect(modalBill.classList.contains("show")).toBeTruthy()
        expect(modalBill.style.display).not.toBe("none")
      })
    })

    describe("Given a bill modal is open", () => {
      describe("when I click on the cross btn", () => {
        test("the modal should close", async () => {
          const onNavigate = (pathname) => {
            document.body.innerHTML = ROUTES({ pathname })
          }
          const store = null
          const newBill = new Bills({
            document,
            onNavigate,
            store,
            localStorage: window.localStorage,
          })
          await waitFor(() => screen.getByTestId("modal-bill"))
          const modalBill = screen.getByTestId("modal-bill")

          const eyeIcon = screen.getAllByTestId("icon-eye")[0]
          const handleClickIconEyeSpy = jest.spyOn(
            newBill,
            "handleClickIconEye"
          )
          eyeIcon.addEventListener("click", () =>
            newBill.handleClickIconEye(eyeIcon)
          )
          fireEvent.click(eyeIcon)
          expect(handleClickIconEyeSpy).toHaveBeenCalled()
          expect(modalBill.classList.contains("show")).toBeTruthy()
          const handleClickCloseSpy = jest.spyOn(newBill, "closeBillModal")
          const closeModalBtn = screen.getByTestId("close-modal-btn")
          closeModalBtn.addEventListener("click", newBill.closeBillModal())
          fireEvent.click(closeModalBtn)
          expect(handleClickCloseSpy).toHaveBeenCalled()
          expect(modalBill.classList.contains("show")).toBeFalsy()
        })
      })
    })

    describe("when I click on the button 'Nouvelle note de frais' ", () => {
      test("Then I navigate to send a Newbill page", () => {
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.append(root)
        router()
        const newBillBtn = screen.getByTestId("btn-new-bill")
        const handleClickNewBill = jest.fn(() => {
          Bills.handleClickNewBill
        })
        newBillBtn.addEventListener("click", handleClickNewBill)
        fireEvent.click(newBillBtn)
        expect(handleClickNewBill).toHaveBeenCalled()
      })
    })
  })

  describe("When I navigate to bills page", () => {
    test("fetches bills from mock API GET", async () => {
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByText("Mes notes de frais"))
      const tbody = screen.getByTestId("tbody")
      const rows = tbody.querySelectorAll("tr")
      expect(rows).toHaveLength(4)

      const firstBillType = screen.getByText("Hôtel et logement")
      expect(firstBillType).toBeTruthy()
      const firstBillillName = screen.getByText("encore")
      expect(firstBillillName).toBeTruthy()
      const firstBillPrice = screen.getByText("400 €")
      expect(firstBillPrice).toBeTruthy()
      const firstBillDate = screen.getByText("2004-04-04")
      expect(firstBillDate).toBeTruthy()
    })

    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills")
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.appendChild(root)
        router()
      })

      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"))
            },
          }
        })
        window.onNavigate(ROUTES_PATH.Bills)
        waitFor(() => {
          const message = screen.getByText(/Erreur 404/)
          expect(message).toBeTruthy()
        })
      })

      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"))
            },
          }
        })

        window.onNavigate(ROUTES_PATH.Bills)
        waitFor(() => {
          const message = screen.getByText(/Erreur 500/)
          expect(message).toBeTruthy()
        })
      })
    })
  })
})
