interface Interface<T> {
  readonly value: T;
  readonly edited: boolean;
}

type WrappedInterface<T> = {
  [P in keyof T]: Interface<T[P]>;
};

export const wrap = <T>(o: T): WrappedInterface<T> => {
  // Create an empty object that we will add the properties to, assert it will be a WrappedInterface<T> once we are done with it
  const result = {} as WrappedInterface<T>;
  // Get all the keys of the original object
  for (const key in Object.keys(o)) {
    // You could instantiate a class, but you will not have access to the type of each property,
    // you could use any instead (for example if Interface<T> is a class you could just call new Interface<any> since types are erased it will not really matter)
    //@ts-ignore
    result[key] = {
      //@ts-ignore
      value: o[key],
      edited: false,
    };
  }
  return result;
};
