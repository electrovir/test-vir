import {getStuff} from './add-get';

async function main() {
    const files = ['./a', './b'];

    const output = await Promise.all(files.map((path) => require(path)));

    console.log(getStuff());
}

main().catch((error) => console.error(error));
