import {ArrayElement} from '../type-augments';
import {FailStates, PassStates, ResultState} from './result-state';

type ResultStateObject = Record<ResultState, string>;
type PassStateObject = Record<ArrayElement<typeof PassStates>, string>;
type FailStateObject = Record<ArrayElement<typeof FailStates>, string>;

const passes: PassStateObject = {} as PassStateObject;
const fails: FailStateObject = {} as FailStateObject;
// this will fail if the fail and pass states do not contain all the possible result states
const combined: ResultStateObject = {...passes, ...fails};
