/**
 * The person's own details, shared across the three generators.
 *
 * Someone filling in a signature and then switching to business cards should
 * not have to type their name and phone number twice, so this lives in shared
 * state rather than in each component.
 */
export const usePerson = () =>
  useState('person', () => ({
    name: '',
    job: '',
    email: '',
    phone: ''
  }))
