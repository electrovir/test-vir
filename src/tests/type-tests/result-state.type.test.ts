import {ResultState} from '../..';
import {FailStates, PassStates} from '../../test-runners/result-state';
import {ArrayElement} from '../../type-augments';

type ResultStateObject = Record<ResultState, string>;
type PassStateObject = Record<ArrayElement<typeof PassStates>, string>;
type FailStateObject = Record<ArrayElement<typeof FailStates>, string>;

const passes: PassStateObject = {} as PassStateObject;
const fails: FailStateObject = {} as FailStateObject;
// this will fail if the fail and pass states do not contain all the possible result states
const combined: ResultStateObject = {...passes, ...fails};
