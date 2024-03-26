// enables intelligent code completion for Cypress commands
// https://on.cypress.io/intelligent-code-completion
/// <reference types="Cypress" />

context('Cypress TodoMVC test', () => {

    it('adds 2 todos', async function () {
        const t0 = performance.now()
        cy.visit('/')
        cy.get('div[id="root"]').should("be.visible")
        cy.wrap(performance.now()).then(t1 => {
            cy.log(`Page load took ${t1 - t0} milliseconds.`);
        })
    })
})