/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js"
import mockStore from "../__mocks__/store"
import { localStorageMock } from "../__mocks__/localStorage.js"
import router from "../app/Router.js"

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
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
  describe("When I am on NewBill Page", () => {
    // Vérifie si l'icon mail est bien mis en valeur dans le layout vertical.
    test("Then mail icon in vertical layout should be highlighted", async () => {
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId("icon-mail"))
      const windowIcon = screen.getByTestId("icon-mail")
      expect(windowIcon.classList.contains("active-icon")).toBeTruthy()
    })

    // Vérifie si le formulaire est bien rendu.
    test("Then form inputs should be render correctly", () => {
      document.body.innerHTML = NewBillUI()
      const formNewBill = screen.getByTestId("form-new-bill")
      const type = screen.getAllByTestId("expense-type")
      const name = screen.getAllByTestId("expense-name")
      const date = screen.getAllByTestId("datepicker")
      const amount = screen.getAllByTestId("amount")
      const vat = screen.getAllByTestId("vat")
      const pct = screen.getAllByTestId("pct")
      const commentary = screen.getAllByTestId("commentary")
      const file = screen.getAllByTestId("file")
      const submitBtn = document.querySelector("#btn-send-bill")
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy()
      expect(formNewBill).toBeTruthy()
      expect(type).toBeTruthy()
      expect(name).toBeTruthy()
      expect(date).toBeTruthy()
      expect(amount).toBeTruthy()
      expect(vat).toBeTruthy()
      expect(pct).toBeTruthy()
      expect(commentary).toBeTruthy()
      expect(file).toBeTruthy()
      expect(submitBtn).toBeTruthy()
    })
    describe("When A file with a correct format is upload", () => {
      // Vérifie le comportement si le fichier est conforme au format attendu.
      test("Then, the  input accept the file with no error message ", async () => {
        const store = null
        const newBill = new NewBill({
          document,
          onNavigate,
          store,
          localStorage,
        })

        const fileInput = screen.getByTestId("file")

        fileInput.addEventListener("change", () => newBill.handleChangeFile)

        // Création d'un fichier avec le bon format.
        const file = new File(["img.jpg"], "imgTest.jpg", {
          type: "image/jpg",
        })
        fireEvent.change(fileInput, {
          target: {
            files: [file],
          },
        })

        expect(fileInput.files[0].name).toBe("imgTest.jpg")
        expect(newBill.fileName).toBe("imgTest.jpg")
        expect(newBill.formData).toBeDefined()
        await waitFor(() => {
          const errorMsg = screen.getByTestId("error-input-file")
          expect(errorMsg.classList.contains("display-error-msg")).toBeFalsy()
        })
      })
    })

    describe("When A file with an incorrect format is upload", () => {
      // Vérifie le comportement si le fichier n'est pas conforme.
      test("Then, the file input value display no name with an error message ", async () => {
        document.body.innerHTML = NewBillUI()
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        const store = null
        const newBill = new NewBill({
          document,
          onNavigate,
          store,
          localStorage,
        })

        const fileInput = screen.getByTestId("file")
        fileInput.addEventListener("change", () => newBill.handleChangeFile)
        const file = new File(["img.jpg"], "imgTest.pdf", {
          type: "application/pdf",
        })
        fireEvent.change(fileInput, {
          target: {
            files: [file],
          },
        })
        expect(fileInput.value).toBe("")
        expect(newBill.fileName).toBeNull()
        expect(newBill.formData).toBeUndefined()
        await waitFor(() => {
          const errorMsg = screen.getByTestId("error-input-file")
          expect(errorMsg.classList.contains("display-error-msg")).toBeTruthy()
        })
      })
    })
  })

  describe("When  I click on 'Envoyer'", () => {
    // Vérifie si la fonction handleSubmit est bien appelée.
    test("Then handleSubmit function is called", async () => {
      document.body.innerHTML = NewBillUI()
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const store = mockStore
      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage,
      })

      const handleSubmitSpy = jest.spyOn(newBill, "handleSubmit")
      const form = screen.getByTestId("form-new-bill")
      form.addEventListener("submit", newBill.handleSubmit)
      fireEvent.submit(form)
      await waitFor(() => {
        expect(handleSubmitSpy).toHaveBeenCalled()
      })
    })
  })
  describe("When a user post a new bill", () => {
    // Vérifie si la nouvelle note de frais est bien ajoutée via le mock
    test("Then a new bill is added through mock API POST ", async () => {
      document.body.innerHTML = NewBillUI()
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const bill = {
        id: "47qAXb6fIm2zOKkLzMro",
        vat: "80",
        fileUrl:
          "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
        status: "pending",
        type: "Hôtel et logement",
        commentary: "séminaire billed",
        name: "encore",
        fileName: "preview-facture-free-201801-pdf-1.jpg",
        date: "2004-04-04",
        amount: 400,
        commentAdmin: "ok",
        email: "a@a",
        pct: 20,
      }
      const store = mockStore
      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage,
      })
      const updateSpy = jest.spyOn(mockStore.bills(), "update")

      const form = screen.getByTestId("form-new-bill")
      form.addEventListener("submit", newBill.handleSubmit)
      fireEvent.submit(form)
      await waitFor(() => {
        expect(updateSpy).toHaveBeenCalled()
      })
      const postedBill = await mockStore.bills().update()
      expect(postedBill).toEqual(bill)
    })

    describe("When an error occurs on API", () => {
      // Vérifie le comportement si une erreur 404 survient lors de l'envoi de la note de frais.
      test("fetches new bill to an API and fails with 404 message error", async () => {
        document.body.innerHTML = NewBillUI();
        const onNavigate = (pathname) => {
            document.body.innerHTML = ROUTES({ pathname });
        };
        const spyOnConsole = jest.spyOn(console, "error");
        const store = {
            bills: jest.fn(() => newBill.store),
            create: jest.fn(() => Promise.resolve({})),
            update: jest.fn(() => Promise.reject({ response: { status: 404 } })),
        };
        const newBill = new NewBill({
            document,
            onNavigate,
            store,
            localStorage,
        });
        const form = screen.getByTestId("form-new-bill");

        form.addEventListener("submit", newBill.handleSubmit);
        fireEvent.submit(form);
        await waitFor(() => {
            expect(spyOnConsole).toHaveBeenCalledWith(expect.objectContaining({ response: { status: 404 } }));
        });
    });


      // Vérifie le comportement si une erreur 500 survient lors de l'envoi de la note de frais.
      test("fetches new bill to an API and fails with 500 message error", async () => {
        document.body.innerHTML = NewBillUI();
        const onNavigate = (pathname) => {
            document.body.innerHTML = ROUTES({ pathname });
        };
        const spyOnConsole = jest.spyOn(console, "error");
        const store = {
            bills: jest.fn(() => newBill.store),
            create: jest.fn(() => Promise.resolve({})),
            update: jest.fn(() => Promise.reject(new Error("500"))),
        };
        const newBill = new NewBill({
            document,
            onNavigate,
            store,
            localStorage,
        });
        const form = screen.getByTestId("form-new-bill");
        form.addEventListener("submit", newBill.handleSubmit);

        fireEvent.submit(form);
        await waitFor(() => {
            expect(spyOnConsole).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    })
  })
})


// reject promess avec 500 404
