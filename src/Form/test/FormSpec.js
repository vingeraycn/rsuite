import React from 'react';
import ReactDOM from 'react-dom';
import ReactTestUtils from 'react-dom/test-utils';
import _isNil from 'lodash/isNil';
import _omit from 'lodash/omit';
import { getDOMNode, getInstance, createTestContainer } from '@test/testUtils';

import Form from '../Form';
import FormControl from '../../FormControl';
import Schema from '../../Schema';

const checkEmail = 'Please input the correct email address';

const model = Schema.Model({
  name: Schema.Types.StringType().addRule(value => {
    return /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(
      value
    );
  }, checkEmail)
});

const modelAsync = Schema.Model({
  name: Schema.Types.StringType().addRule(value => {
    return new Promise(resolve => {
      setTimeout(() => {
        if (value != 'bac') {
          resolve(false);
        }
        resolve(true);
      }, 500);
    });
  }, 'Duplicate name')
});

describe('Form', () => {
  it('Should render a Form', () => {
    let title = 'Test';
    let instance = getDOMNode(<Form>{title}</Form>);
    assert.equal(instance.tagName, 'FORM');
    assert.equal(instance.innerHTML, title);
  });

  it('Should be horizontal', () => {
    const instance = getDOMNode(<Form layout="horizontal" />);

    assert.include(instance.className, 'rs-form-horizontal');
  });

  it('Should be inline', () => {
    const instance = getDOMNode(<Form layout="inline" />);

    assert.include(instance.className, 'rs-form-inline');
  });

  it('Should have a value', () => {
    const values = {
      name: 'abc',
      email: 'aa@ss.com'
    };
    const instance = getDOMNode(
      <Form formValue={values}>
        <FormControl name="name" />
        <FormControl name="email" />
      </Form>
    );
    assert.equal(instance.querySelector('input[name="name"]').value, values.name);
    assert.equal(instance.querySelector('input[name="email"]').value, values.email);
  });

  it('Should have a default values', () => {
    const values = {
      name: 'abc',
      email: 'aa@ss.com'
    };
    const instance = getDOMNode(
      <Form formDefaultValue={values}>
        <FormControl name="name" />
        <FormControl name="email" />
      </Form>
    );
    assert.equal(instance.querySelector('input[name="name"]').value, values.name);
    assert.equal(instance.querySelector('input[name="email"]').value, values.email);
  });

  it('Should be `false` for check status', () => {
    const values = {
      name: 'abc'
    };
    const instance = getInstance(
      <Form model={model} formDefaultValue={values}>
        <FormControl name="name" />
      </Form>
    );
    assert.equal(instance.check(), false);
  });

  it('Should be `false` for check status by checkForField', () => {
    const values = {
      name: 'abc'
    };
    const instance = getInstance(
      <Form
        model={model}
        formDefaultValue={values}
        onError={formError => {
          assert.equal(formError.name, checkEmail);
        }}
      >
        <FormControl name="name" />
      </Form>
    );
    const checkStatus = instance.checkForField('name', checkResult => {
      assert.equal(checkResult.hasError, true);
      assert.equal(checkResult.errorMessage, checkEmail);
    });
    assert.equal(checkStatus, false);
  });

  it('Should be `true` for check status', () => {
    const values = {
      name: 'abc@gmail.com'
    };
    const instance = getInstance(
      <Form model={model} formDefaultValue={values}>
        <FormControl name="name" />
      </Form>
    );
    assert.equal(instance.check(), true);
  });

  it('Should be `true` for check status by checkForField', () => {
    const values = {
      name: 'abc@gmail.com'
    };
    const instance = getInstance(
      <Form model={model} formDefaultValue={values}>
        <FormControl name="name" />
      </Form>
    );
    const checkStatus = instance.checkForField('name', checkResult => {
      assert.equal(checkResult.hasError, false);
    });
    assert.equal(checkStatus, true);
  });

  it('Should be {} for formError when call cleanErrors', () => {
    const values = {
      name: 'abc.com'
    };

    const instance = getInstance(
      <Form model={model} formDefaultValue={values}>
        <FormControl name="name" />
      </Form>
    );
    instance.check();
    instance.cleanErrors(() => {
      assert.equal(Object.keys(instance.state.formError).length, 0);
    });
  });

  it('Should be {n1} for formError when call cleanErrorForField', () => {
    const values = {
      n1: 1,
      n2: 1
    };
    const model = Schema.Model({
      n1: Schema.Types.NumberType().min(2, 'error'),
      n2: Schema.Types.NumberType().min(2, 'error')
    });

    const instance = getInstance(
      <Form model={model} formDefaultValue={values}>
        <FormControl name="n1" />
        <FormControl name="n2" />
      </Form>
    );
    instance.check();
    instance.cleanErrorForField('n2', () => {
      assert.equal(instance.state.formError.n1, 'error');
      assert.equal(instance.state.formError.n2, undefined);
    });
  });

  it('Should be {name:"error"} for formError when call resetErrors', () => {
    const values = {
      name: 'abc.com'
    };
    const instance = getInstance(
      <Form model={model} formDefaultValue={values}>
        <FormControl name="name" />
      </Form>
    );
    instance.resetErrors({ name: 'error' }, () => {
      assert.equal(instance.state.formError.name, 'error');
    });
  });

  it('Should call onChange callback with correct form values', done => {
    const values = {
      name: 'abc'
    };

    const doneOp = v => {
      try {
        assert.deepEqual(v, values);
        done();
      } catch (err) {
        done(err);
      }
    };
    const instance = getDOMNode(
      <Form formDefaultValue={values} onChange={doneOp}>
        <FormControl name="name" />
      </Form>
    );
    ReactTestUtils.Simulate.change(instance.querySelector('input[name="name"]'));
  });

  it('Should clear error', done => {
    const tip = 'This field is required.';
    const curModel = Schema.Model({
      name1: Schema.Types.StringType().isRequired(tip),
      name2: Schema.Types.StringType().isRequired(tip),
      name3: Schema.Types.StringType().isRequired(tip),
      number: Schema.Types.StringType().isRequired(tip)
    });

    const formRef = React.createRef();
    class Demo extends React.Component {
      constructor(props) {
        super(props);
        this.state = {
          formValue: {
            name1: '',
            name2: '',
            name3: '',
            number: '123'
          },
          formError: {}
        };
      }

      handleChangeNum = () => {
        this.setState(({ formValue, formError }) => ({
          formValue: {
            ...formValue,
            name1: 'abc@qq.com',
            name2: 'abc@qq.com',
            name3: 'abc@qq.com'
          },
          formError: _omit(formError, ['name1', 'name2', 'name3'])
        }));
      };

      result = true;
      count = 0;
      handleChange = formError =>
        this.setState({ formError }, () => {
          const { formValue, formError } = this.state;
          switch (++this.count) {
            case 1:
              this.result =
                this.result &&
                formValue.name1 === '' &&
                !_isNil(formError.name1) &&
                formValue.name2 === '' &&
                _isNil(formError.name2) &&
                formValue.name3 === '' &&
                _isNil(formError.name3);
              break;
            case 2:
              this.result =
                this.result &&
                formValue.name1 === '' &&
                !_isNil(formError.name1) &&
                formValue.name2 === '' &&
                !_isNil(formError.name2) &&
                formValue.name3 === '' &&
                _isNil(formError.name3);
              break;
            case 3:
              this.result =
                this.result &&
                formValue.name1 === '' &&
                !_isNil(formError.name1) &&
                formValue.name2 === '' &&
                !_isNil(formError.name2) &&
                formValue.name3 === '' &&
                !_isNil(formError.name3);
              break;
            case 4:
              this.result =
                this.result &&
                formValue.name1 === 'abc@qq.com' &&
                _isNil(formError.name1) &&
                formValue.name2 === 'abc@qq.com' &&
                _isNil(formError.name2) &&
                formValue.name3 === 'abc@qq.com' &&
                _isNil(formError.name3);
              try {
                assert.isTrue(this.result);
                done();
              } catch (err) {
                done(err);
              }
          }
        });

      render() {
        const { formValue, formError } = this.state;
        return (
          <Form
            ref={formRef}
            model={curModel}
            formValue={formValue}
            formError={formError}
            onChange={formValue => this.setState({ formValue })}
            onCheck={this.handleChange}
          >
            <FormControl name="name1" />
            <FormControl name="name2" />
            <FormControl name="name3" />
            <FormControl name="number" onChange={this.handleChangeNum} />
          </Form>
        );
      }
    }

    getInstance(<Demo />);

    const element = formRef.current.root;
    ReactTestUtils.Simulate.change(element.querySelector('input[name="name1"]'));
    ReactTestUtils.Simulate.change(element.querySelector('input[name="name2"]'));
    ReactTestUtils.Simulate.change(element.querySelector('input[name="name3"]'));
    ReactTestUtils.Simulate.change(element.querySelector('input[name="number"]'));
  });

  it('Should call onError callback', done => {
    const values = {
      name: 'abc'
    };

    const doneOp = v => {
      try {
        assert.equal(v.name, checkEmail);
        done();
      } catch (err) {
        done(err);
      }
    };
    const instance = getDOMNode(
      <Form formDefaultValue={values} onError={doneOp} model={model}>
        <FormControl name="name" />
      </Form>
    );
    ReactTestUtils.Simulate.change(instance.querySelector('input[name="name"]'));
  });

  it('Should not call onError callback', done => {
    let isValid = true;
    const values = {
      name: 'abc@ddd.com'
    };

    const doneOp = () => {
      isValid = false;
    };

    setTimeout(() => {
      if (isValid) {
        done();
      }
    }, 10);

    const instance = getDOMNode(
      <Form formDefaultValue={values} onError={doneOp} model={model}>
        <FormControl name="name" />
      </Form>
    );
    ReactTestUtils.Simulate.change(instance.querySelector('input[name="name"]'));
  });

  it('Should call onCheck callback', done => {
    const values = {
      name: 'abc'
    };

    const doneOp = v => {
      try {
        assert.typeOf(v.name, 'undefined');
        done();
      } catch (err) {
        done(err);
      }
    };
    const instance = getDOMNode(
      <Form formDefaultValue={values} onCheck={doneOp}>
        <FormControl name="name" />
      </Form>
    );
    ReactTestUtils.Simulate.change(instance.querySelector('input[name="name"]'));
  });

  it('Should call onCheck callback when blur', done => {
    const values = {
      name: 'abc'
    };

    const doneOp = v => {
      try {
        assert.typeOf(v.name, 'undefined');
        done();
      } catch (err) {
        done(err);
      }
    };
    const instance = getDOMNode(
      <Form formDefaultValue={values} onCheck={doneOp} checkTrigger="blur">
        <FormControl name="name" />
      </Form>
    );
    ReactTestUtils.Simulate.blur(instance.querySelector('input[name="name"]'));
  });

  it('Should not call onCheck callback when checkTrigger is null', done => {
    let isValid = true;
    const values = {
      name: 'abc'
    };

    const doneOp = () => {
      isValid = false;
    };

    setTimeout(() => {
      if (isValid) {
        done();
      }
    }, 10);

    const instance = getDOMNode(
      <Form formDefaultValue={values} onCheck={doneOp} checkTrigger={null}>
        <FormControl name="name" />
      </Form>
    );
    ReactTestUtils.Simulate.blur(instance.querySelector('input[name="name"]'));
    ReactTestUtils.Simulate.change(instance.querySelector('input[name="name"]'));
  });

  it('Should call onCheck callback', done => {
    const values = {
      name: 'abc'
    };

    const doneOp = v => {
      try {
        assert.deepEqual(v, {
          email: 'email is null'
        });
        done();
      } catch (err) {
        done(err);
      }
    };
    const instance = getDOMNode(
      <Form
        formDefaultValue={values}
        onCheck={doneOp}
        formError={{
          email: 'email is null'
        }}
      >
        <FormControl name="name" />
      </Form>
    );
    ReactTestUtils.Simulate.change(instance.querySelector('input[name="name"]'));
  });

  it('Should have a custom className', () => {
    let instance = getDOMNode(<Form className="custom" />);
    assert.ok(instance.className.match(/\bcustom\b/));
  });

  it('Should have a custom style', () => {
    const fontSize = '12px';
    let instance = getDOMNode(<Form style={{ fontSize }} />);
    assert.equal(instance.style.fontSize, fontSize);
  });

  it('Should have a custom className prefix', () => {
    const instance = getDOMNode(<Form classPrefix="custom-prefix" />);
    assert.ok(instance.className.match(/\bcustom-prefix\b/));
  });

  /*** checkAsync */
  it('Should call onError callback by checkAsync', done => {
    const values = {
      name: 'abc'
    };
    const doneOp = v => {
      try {
        assert.deepEqual(v, {
          name: 'Duplicate name'
        });
        done();
      } catch (err) {
        done(err);
      }
    };
    const instance = getDOMNode(
      <Form formDefaultValue={values} onError={doneOp} model={modelAsync}>
        <FormControl name="name" checkAsync />
      </Form>
    );
    ReactTestUtils.Simulate.change(instance.querySelector('input[name="name"]'));
  });

  it('Check status should be fired on checkAsync ', done => {
    const values = {
      name: 'abc'
    };
    const instance = getInstance(
      <Form formDefaultValue={values} model={modelAsync}>
        <FormControl name="name" checkAsync />
      </Form>
    );
    instance.checkAsync().then(result => {
      try {
        assert.isTrue(result.hasError);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('Check status should be fired on checkForFieldAsync', done => {
    const values = {
      name: 'abc'
    };
    const instance = getInstance(
      <Form formDefaultValue={values} model={modelAsync}>
        <FormControl name="name" checkAsync />
      </Form>
    );
    instance.checkForFieldAsync('name').then(result => {
      try {
        assert.isTrue(result.hasError);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('Should support complex inspections by onChange', done => {
    const model = Schema.Model({
      items: Schema.Types.ArrayType().of(
        Schema.Types.ObjectType().shape({
          field1: Schema.Types.StringType().isRequired('error1'),
          field2: Schema.Types.NumberType().isRequired('error2')
        })
      )
    });

    // eslint-disable-next-line react/prop-types
    const Field = ({ onChange }) => {
      const handleChange = () => {
        onChange([{ field1: '', field2: '' }]);
      };
      return <input name="items" onChange={handleChange} />;
    };

    const values = {
      items: []
    };

    const doneOp = error => {
      const item = error.items.array[0].object;
      try {
        assert.isTrue(error.items.hasError);
        assert.deepEqual(item, {
          field1: {
            hasError: true,
            errorMessage: 'error1'
          },
          field2: {
            hasError: true,
            errorMessage: 'error2'
          }
        });
        done();
      } catch (err) {
        done(err);
      }
    };
    const instance = getDOMNode(
      <Form formDefaultValue={values} onError={doneOp} model={model}>
        <FormControl name="items" accepter={Field} />
      </Form>
    );
    ReactTestUtils.Simulate.change(instance.querySelector('input[name="items"]'));
  });

  it('Should support complex inspections by check method ', done => {
    const model = Schema.Model({
      items: Schema.Types.ArrayType().of(
        Schema.Types.ObjectType().shape({
          field1: Schema.Types.StringType().isRequired('error1'),
          field2: Schema.Types.NumberType().isRequired('error2')
        })
      )
    });

    const Field = () => {
      return <input name="items" />;
    };

    const values = {
      items: [{ field1: '', field2: '' }]
    };

    const doneOp = error => {
      const item = error.items.array[0].object;
      try {
        assert.isTrue(error.items.hasError);
        assert.deepEqual(item, {
          field1: {
            hasError: true,
            errorMessage: 'error1'
          },
          field2: {
            hasError: true,
            errorMessage: 'error2'
          }
        });
        done();
      } catch (err) {
        done(err);
      }
    };

    const formRef = React.createRef();

    ReactTestUtils.act(() => {
      ReactDOM.render(
        <Form formDefaultValue={values} onError={doneOp} model={model} ref={formRef}>
          <FormControl name="items" accepter={Field} />
        </Form>,
        createTestContainer()
      );
    });
    ReactTestUtils.act(() => {
      formRef.current.check();
    });
  });
});
